const { getDatabase, saveDatabase } = require('../db/dbManager');

function registerMenuHandlers(ipcMain) {
  
  // 1. Save list of items and categories locally
  ipcMain.handle('db:save-menu-cache', async (event, items, categories) => {
    const db = getDatabase();
    
    const insertSql = `
      INSERT OR REPLACE INTO menu_cache (id, type, name, dataJson, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      db.run("BEGIN TRANSACTION;");

      if (Array.isArray(items)) {
        for (const item of items) {
          db.run(insertSql, [item._id || item.id, 'item', item.name, JSON.stringify(item), new Date().toISOString()]);
        }
      }
      if (Array.isArray(categories)) {
        for (const cat of categories) {
          db.run(insertSql, [cat._id || cat.id, 'category', cat.name, JSON.stringify(cat), new Date().toISOString()]);
        }
      }

      db.run("COMMIT;");
      
      // Save changes to disk
      saveDatabase();

      return { success: true };
    } catch (error) {
      try { db.run("ROLLBACK;"); } catch(e) {}
      console.error('[SQL.js] Save menu cache failed:', error);
      return { success: false, error: error.message };
    }
  });

  // 2. Load cached menu items and categories
  ipcMain.handle('db:get-menu-cache', async (event) => {
    const db = getDatabase();
    try {
      const stmt = db.prepare('SELECT * FROM menu_cache');
      
      const items = [];
      const categories = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject();
        const parsed = JSON.parse(row.dataJson);
        if (row.type === 'item') {
          items.push(parsed);
        } else if (row.type === 'category') {
          categories.push(parsed);
        }
      }
      stmt.free();

      return { success: true, items, categories };
    } catch (error) {
      console.error('[SQL.js] Get menu cache failed:', error);
      return { success: false, error: error.message };
    }
  });

  // 3. Save table status and definitions locally
  ipcMain.handle('db:save-tables-cache', async (event, tables) => {
    const db = getDatabase();
    const insertSql = `
      INSERT OR REPLACE INTO tables_cache (id, name, status, dataJson, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      db.run("BEGIN TRANSACTION;");

      if (Array.isArray(tables)) {
        for (const tbl of tables) {
          db.run(insertSql, [tbl._id || tbl.id, tbl.name, tbl.status || 'available', JSON.stringify(tbl), new Date().toISOString()]);
        }
      }

      db.run("COMMIT;");
      
      // Save changes to disk
      saveDatabase();

      return { success: true };
    } catch (error) {
      try { db.run("ROLLBACK;"); } catch(e) {}
      console.error('[SQL.js] Save tables cache failed:', error);
      return { success: false, error: error.message };
    }
  });

  // 4. Load cached tables
  ipcMain.handle('db:get-tables-cache', async (event) => {
    const db = getDatabase();
    try {
      const stmt = db.prepare('SELECT * FROM tables_cache');
      
      const tables = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        tables.push(JSON.parse(row.dataJson));
      }
      stmt.free();

      return { success: true, tables };
    } catch (error) {
      console.error('[SQL.js] Get tables cache failed:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { registerMenuHandlers };
