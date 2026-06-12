require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const connectDB = require('./Config/db');
const routes = require('./app');
const checkAndProvisionLocalAdmin = require('./Utils/localAdminCheck');
const { startHeartbeatService } = require('./Utils/HeartbeatService');

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

// Database
connectDB().then(async () => {
  checkAndProvisionLocalAdmin();
  startHeartbeatService();
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
  res.send('Admin API is running with Socket.IO support...');
});

// Socket connection for Admin/POS functionality (if needed)
io.on('connection', (socket) => {
  console.log('⚡ Admin Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('❌ Admin Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Admin Server running on port ${PORT}`));
