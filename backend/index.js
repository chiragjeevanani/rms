require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./Config/db');
const routes = require('./app');
const initSuperAdmin = require('./Utils/superAdminInit');
const checkAndProvisionAdmins = require('./Utils/adminProvisionCheck');
const checkAndProvisionLocalAdmin = require('./Utils/localAdminCheck');
// mongodb://mohammadrehan00121_db_user:L4SOVC0ipr5Ez0y3@ac-pxrc1fm-shard-00-00.vydv7ur.mongodb.net:27017,ac-pxrc1fm-shard-00-01.vydv7ur.mongodb.net:27017,ac-pxrc1fm-shard-00-02.vydv7ur.mongodb.net:27017/RMS-Superadmin?ssl=true&replicaSet=atlas-112ag1-shard-0&authSource=admin&appName=Cluster0
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set io globally to use in controllers
app.set('socketio', io);

const migrateRegistry = require('./scripts/migrate_registry');

// Database
connectDB().then(async () => {
  // Always initialize default SuperAdmin credentials centrally
  await initSuperAdmin();

  const isSuperAdmin = process.env.IS_SUPERADMIN === 'true' || !process.env.MONGODB_URL;
  if (isSuperAdmin) {
    await migrateRegistry();
    checkAndProvisionAdmins();
  } else {
    checkAndProvisionLocalAdmin();
  }
});

// Routes
app.use('/api', routes);

// Routes for Wera webhooks (configured in Wera partner portal)
const weraController = require('./Controllers/weraController');
app.post('/ol/api/v1/getOrder', weraController.orderWebhook);
app.post('/ol/api/v1/cancelOrder', weraController.orderWebhook);
app.post('/ol/api/v1/getDeliveryAgentDet', weraController.orderWebhook);
app.post('/ol/api/v1/autoAccept', weraController.orderWebhook);

app.get('/', (req, res) => {
  res.send('API is running with Socket.IO support...');
});

// Socket connection
const superAdminController = require('./Controllers/superAdminController');

io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  socket.on('request_all_admins', async () => {
    const mockReq = { query: {} };
    const mockRes = {
      json: (result) => {
        socket.emit('response_all_admins', result);
      },
      status: (code) => ({
        json: (result) => {
          socket.emit('response_all_admins', { ...result, errorStatus: code });
        }
      })
    };
    try {
      await superAdminController.getGlobalAdmins(mockReq, mockRes);
    } catch (err) {
      socket.emit('response_all_admins', { success: false, message: err.message });
    }
  });

  socket.on('request_global_admins', async (queryParams) => {
    const mockReq = { query: queryParams || {} };
    const mockRes = {
      json: (result) => {
        socket.emit('response_global_admins', result);
      },
      status: (code) => ({
        json: (result) => {
          socket.emit('response_global_admins', { ...result, errorStatus: code });
        }
      })
    };
    try {
      await superAdminController.getGlobalAdmins(mockReq, mockRes);
    } catch (err) {
      socket.emit('response_global_admins', { success: false, message: err.message });
    }
  });

  socket.on('request_dashboard_stats', async () => {
    const mockReq = {};
    const mockRes = {
      json: (result) => {
        socket.emit('response_dashboard_stats', result);
      },
      status: (code) => ({
        json: (result) => {
          socket.emit('response_dashboard_stats', { ...result, errorStatus: code });
        }
      })
    };
    try {
      await superAdminController.getDashboardStats(mockReq, mockRes);
    } catch (err) {
      socket.emit('response_dashboard_stats', { success: false, message: err.message });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
