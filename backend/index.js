require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./Config/db');
const routes = require('./app');

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

// Set io globally to use in controllers
app.set('socketio', io);

// Database
connectDB();

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
  res.send('API is running with Socket.IO support...');
});

// Socket connection
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
