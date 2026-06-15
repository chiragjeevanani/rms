const { getDatabase, saveDatabase } = require('../db/dbManager');
const { v4: uuidv4 } = require('uuid');

function registerOrderHandlers(ipcMain) {
  
  // 1. Create a new Order locally
  ipcMain.handle('db:create-order', async (event, orderData) => {
    const db = getDatabase();
    
    const id = orderData.id || uuidv4();
    const orderNumber = orderData.orderNumber || `POS-${Date.now().toString().slice(-6)}`;
    const tableName = orderData.tableName || 'Takeaway';
    const tableId = orderData.tableId || null;
    const customerJson = JSON.stringify(orderData.customer || {});
    const itemsJson = JSON.stringify(orderData.items || []);
    const paymentsJson = JSON.stringify(orderData.payments || []);
    const subTotal = parseFloat(orderData.subTotal || 0);
    const tax = parseFloat(orderData.tax || 0);
    const discountJson = JSON.stringify(orderData.discount || { amount: 0, type: 'fixed', reason: '' });
    const grandTotal = parseFloat(orderData.grandTotal || 0);
    const isBilled = orderData.isBilled ? 1 : 0;
    const orderType = orderData.orderType || 'Dine-In';
    const waiterName = orderData.waiterName || 'POS Cashier';
    const status = orderData.status || 'pending';
    const branchId = orderData.branchId || 'LOCAL_POS';
    const syncStatus = 'pending';
    const createdAt = orderData.createdAt || new Date().toISOString();
    const updatedAt = new Date().toISOString();

    const insertOrderSql = `
      INSERT INTO orders (
        id, orderNumber, tableName, tableId, customerJson, itemsJson, paymentsJson,
        subTotal, tax, discountJson, grandTotal, isBilled, orderType, waiterName,
        status, branchId, syncStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const insertQueueSql = `
      INSERT INTO sync_queue (
        id, actionType, payload, status, retryCount, lastError, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    try {
      db.run("BEGIN TRANSACTION;");

      // Save to local orders
      db.run(insertOrderSql, [
        id, orderNumber, tableName, tableId, customerJson, itemsJson, paymentsJson,
        subTotal, tax, discountJson, grandTotal, isBilled, orderType, waiterName,
        status, branchId, syncStatus, createdAt, updatedAt
      ]);

      // Add to background sync queue
      const queuePayload = JSON.stringify({
        id, orderNumber, tableName, tableId,
        customer: orderData.customer || {},
        items: orderData.items || [],
        payments: orderData.payments || [],
        subTotal, tax,
        discount: orderData.discount || { amount: 0, type: 'fixed', reason: '' },
        grandTotal, isBilled: isBilled === 1,
        orderType, waiterName, status, branchId,
        createdAt, updatedAt
      });

      db.run(insertQueueSql, [
        uuidv4(),
        'CREATE_ORDER',
        queuePayload,
        'pending',
        0,
        null,
        new Date().toISOString()
      ]);

      db.run("COMMIT;");
      
      // Save changes to physical disk file
      saveDatabase();

      return { 
        success: true, 
        order: { ...orderData, id, orderNumber, status, isBilled: isBilled === 1 } 
      };
    } catch (error) {
      try { db.run("ROLLBACK;"); } catch(e) {}
      console.error('[SQL.js] Create order failed:', error);
      return { success: false, error: error.message };
    }
  });

  // 2. Get local orders with filters
  ipcMain.handle('db:get-orders', async (event, filters = {}) => {
    const db = getDatabase();
    let sql = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.isBilled !== undefined) {
      sql += ' AND isBilled = ?';
      params.push(filters.isBilled ? 1 : 0);
    }
    if (filters.branchId) {
      sql += ' AND branchId = ?';
      params.push(filters.branchId);
    }

    sql += ' ORDER BY createdAt DESC';

    try {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      
      const orders = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        orders.push({
          ...row,
          customer: JSON.parse(row.customerJson || '{}'),
          items: JSON.parse(row.itemsJson || '[]'),
          payments: JSON.parse(row.paymentsJson || '[]'),
          discount: JSON.parse(row.discountJson || '{}'),
          isBilled: row.isBilled === 1
        });
      }
      stmt.free();

      return { success: true, orders };
    } catch (error) {
      console.error('[SQL.js] Get orders failed:', error);
      return { success: false, error: error.message };
    }
  });

  // 3. Update an existing order
  ipcMain.handle('db:update-order', async (event, id, updates) => {
    const db = getDatabase();
    
    try {
      // Fetch orderNumber to include in sync queue
      const stmt = db.prepare('SELECT orderNumber FROM orders WHERE id = ?');
      stmt.bind([id]);
      const order = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();

      if (!order) {
        return { success: false, error: 'Order not found locally' };
      }
      const orderNumber = order.orderNumber;

      const fields = [];
      const params = [];

      if (updates.status) {
        fields.push('status = ?');
        params.push(updates.status);
      }
      if (updates.isBilled !== undefined) {
        fields.push('isBilled = ?');
        params.push(updates.isBilled ? 1 : 0);
      }
      if (updates.payments) {
        fields.push('paymentsJson = ?');
        params.push(JSON.stringify(updates.payments));
      }
      if (updates.items) {
        fields.push('itemsJson = ?');
        params.push(JSON.stringify(updates.items));
      }
      if (updates.subTotal !== undefined) {
        fields.push('subTotal = ?');
        params.push(updates.subTotal);
      }
      if (updates.tax !== undefined) {
        fields.push('tax = ?');
        params.push(updates.tax);
      }
      if (updates.discount) {
        fields.push('discountJson = ?');
        params.push(JSON.stringify(updates.discount));
      }
      if (updates.grandTotal !== undefined) {
        fields.push('grandTotal = ?');
        params.push(updates.grandTotal);
      }
      if (updates.customer) {
        fields.push('customerJson = ?');
        params.push(JSON.stringify(updates.customer));
      }
      
      fields.push('updatedAt = ?');
      params.push(new Date().toISOString());

      // Push ID for where clause
      params.push(id);

      const updateSql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;

      db.run("BEGIN TRANSACTION;");
      
      // Update order
      db.run(updateSql, params);

      // Add to sync queue
      db.run(`
        INSERT INTO sync_queue (id, actionType, payload, status, retryCount, lastError, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(),
        'UPDATE_ORDER',
        JSON.stringify({ id, orderNumber, updates }),
        'pending',
        0,
        null,
        new Date().toISOString()
      ]);

      db.run("COMMIT;");
      
      // Save changes to disk
      saveDatabase();

      return { success: true };
    } catch (error) {
      try { db.run("ROLLBACK;"); } catch(e) {}
      console.error('[SQL.js] Update order failed:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerOrderHandlers };
