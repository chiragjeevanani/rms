const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { queries } = require('./schema');

let db = null;
let dbPath = '';

async function initDatabase() {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'rms_pos_local.db');
  
  console.log(`[SQL.js] Initializing WebAssembly SQLite database at: ${dbPath}`);

  try {
    const SQL = await initSqlJs();

    if (fs.existsSync(dbPath)) {
      const filebuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(filebuffer);
      console.log('[SQL.js] Loaded database file from disk.');
    } else {
      db = new SQL.Database();
      console.log('[SQL.js] Created new blank database instance.');
    }

    // Initialize tables inside a transaction
    db.run("BEGIN TRANSACTION;");
    for (const query of queries) {
      db.run(query);
    }
    db.run("COMMIT;");

    // Persist the tables immediately
    saveDatabase();
    
    console.log('[SQL.js] All tables verified and ready.');
  } catch (error) {
    if (db) {
      try { db.run("ROLLBACK;"); } catch(e) {}
    }
    console.error('[SQL.js] Database bootstrap failed:', error);
    throw error;
  }

  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Please call initDatabase() first.');
  }
  return db;
}

function saveDatabase() {
  if (!db || !dbPath) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
    console.log('[SQL.js] SQLite state persisted to disk.');
  } catch (error) {
    console.error('[SQL.js] Disk serialization failed:', error);
  }
}

module.exports = {
  initDatabase,
  getDatabase,
  saveDatabase
};
