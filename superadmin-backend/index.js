require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const connectDB = require('./Config/db');
const routes = require('./app');
const initSuperAdmin = require('./Utils/superAdminInit');
const checkAndProvisionAdmins = require('./Utils/adminProvisionCheck');
const { initializeSyncWorker } = require('./Utils/SyncQueue');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database
connectDB().then(async () => {
  await initSuperAdmin();
  checkAndProvisionAdmins();
  initializeSyncWorker();
});

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`SuperAdmin Server running on port ${PORT}`));
