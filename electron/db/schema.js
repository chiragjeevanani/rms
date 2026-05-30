const CREATE_ORDERS_TABLE = `
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    orderNumber TEXT UNIQUE NOT NULL,
    tableName TEXT NOT NULL,
    tableId TEXT,
    customerJson TEXT,
    itemsJson TEXT NOT NULL,
    paymentsJson TEXT,
    subTotal REAL DEFAULT 0.0,
    tax REAL DEFAULT 0.0,
    discountJson TEXT,
    grandTotal REAL NOT NULL,
    isBilled INTEGER DEFAULT 0,
    orderType TEXT NOT NULL,
    waiterName TEXT,
    status TEXT DEFAULT 'pending',
    branchId TEXT NOT NULL,
    syncStatus TEXT DEFAULT 'pending',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`;

const CREATE_SYNC_QUEUE_TABLE = `
  CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    actionType TEXT NOT NULL,
    payload TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    retryCount INTEGER DEFAULT 0,
    lastError TEXT,
    createdAt TEXT NOT NULL
  )
`;

const CREATE_MENU_CACHE_TABLE = `
  CREATE TABLE IF NOT EXISTS menu_cache (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL, -- 'category' or 'item'
    name TEXT NOT NULL,
    dataJson TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`;

const CREATE_TABLES_CACHE_TABLE = `
  CREATE TABLE IF NOT EXISTS tables_cache (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available',
    dataJson TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )
`;

module.exports = {
  queries: [
    CREATE_ORDERS_TABLE,
    CREATE_SYNC_QUEUE_TABLE,
    CREATE_MENU_CACHE_TABLE,
    CREATE_TABLES_CACHE_TABLE
  ]
};
