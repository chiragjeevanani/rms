const { getDatabase, saveDatabase } = require('./db/dbManager');

const API_BASE_URL = 'http://localhost:3000/api';
let syncTimer = null;
let isSyncing = false;

// Helper: Check actual connectivity by pinging the backend server
async function checkConnectivity() {
  try {
    const res = await fetch(`${API_BASE_URL}/tables`, { method: 'GET', signal: AbortSignal.timeout(3000) });
    return res.status === 200 || res.status === 304;
  } catch (err) {
    return false;
  }
}

// Perform sync process
async function executeSync() {
  if (isSyncing) return;
  
  // Verify network before proceeding
  const isOnline = await checkConnectivity();
  if (!isOnline) {
    console.log('[SyncEngine] Backend server offline. Postponing sync cycle.');
    return;
  }

  isSyncing = true;
  const db = getDatabase();

  try {
    // Read pending queue entries chronologically
    const stmt = db.prepare(`
      SELECT * FROM sync_queue 
      WHERE status = 'pending' 
         OR (status = 'failed' AND retryCount < 5)
      ORDER BY createdAt ASC
    `);

    const pendingItems = [];
    while (stmt.step()) {
      pendingItems.push(stmt.getAsObject());
    }
    stmt.free();

    if (pendingItems.length === 0) {
      isSyncing = false;
      return;
    }

    console.log(`[SyncEngine] Found ${pendingItems.length} items to synchronize with cloud.`);

    for (const item of pendingItems) {
      console.log(`[SyncEngine] Processing item ${item.id} of type: ${item.actionType}`);
      
      // Update item status in queue to 'syncing' and save to disk
      db.run("UPDATE sync_queue SET status = 'syncing' WHERE id = ?", [item.id]);
      saveDatabase();

      const payload = JSON.parse(item.payload);
      let success = false;
      let errorMessage = '';

      try {
        let endpoint = `${API_BASE_URL}/sync/orders`;
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionType: item.actionType,
            payload: payload
          }),
          signal: AbortSignal.timeout(8000)
        });

        if (response.status === 200 || response.status === 201) {
          success = true;
        } else {
          const errText = await response.text();
          errorMessage = `HTTP ${response.status}: ${errText}`;
        }
      } catch (err) {
        errorMessage = err.message;
      }

      if (success) {
        try {
          db.run("BEGIN TRANSACTION;");
          // 1. If it's an order operation, mark corresponding order as synced
          if (item.actionType === 'CREATE_ORDER' || item.actionType === 'UPDATE_ORDER') {
            const orderId = payload.id;
            db.run("UPDATE orders SET syncStatus = 'synced' WHERE id = ?", [orderId]);
          }
          // 2. Remove the sync item from queue
          db.run("DELETE FROM sync_queue WHERE id = ?", [item.id]);
          db.run("COMMIT;");
          
          // Persist transaction to disk
          saveDatabase();
          console.log(`[SyncEngine] Sync successful for item: ${item.id}`);
        } catch (txnError) {
          try { db.run("ROLLBACK;"); } catch(e) {}
          console.error('[SyncEngine] Local commit failed, rolling back sync update:', txnError);
          break;
        }
      } else {
        // Handle sync failure (increment retry count and save error)
        db.run(`
          UPDATE sync_queue 
          SET status = 'failed', 
              retryCount = retryCount + 1, 
              lastError = ? 
          WHERE id = ?
        `, [errorMessage, item.id]);
        
        saveDatabase();
        console.error(`[SyncEngine] Sync failed for item ${item.id}: ${errorMessage}`);
        
        // Break out of loop to retry on the next cycle, maintaining FIFO integrity
        break;
      }
    }
  } catch (err) {
    console.error('[SyncEngine] Error in sync process loop:', err);
  } finally {
    isSyncing = false;
  }
}

// Start the periodic Sync Engine loop
function startSyncEngine() {
  if (syncTimer) return;

  console.log('[SyncEngine] Starting background sync worker (15s interval)...');
  
  // Run an immediate execution then schedule
  executeSync();
  syncTimer = setInterval(executeSync, 15000);
}

// Stop the loop
function stopSyncEngine() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log('[SyncEngine] Background sync worker stopped.');
  }
}

// Get count of pending sync items
function getPendingQueueCount() {
  try {
    const db = getDatabase();
    const stmt = db.prepare("SELECT COUNT(*) as count FROM sync_queue");
    const count = stmt.step() ? stmt.getAsObject().count : 0;
    stmt.free();
    return count;
  } catch (err) {
    return 0;
  }
}

module.exports = {
  startSyncEngine,
  stopSyncEngine,
  executeSync,
  getPendingQueueCount
};
