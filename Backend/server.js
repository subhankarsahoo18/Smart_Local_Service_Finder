const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

// FORCE IPv4 RESOLUTION (Prevents IPv6 ENETUNREACH errors in production for Gmail/Cloudinary)
const dns = require('dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO — allows the frontend to get real-time updates without page refresh
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Each user/provider joins a personal room keyed by their userId
  socket.on('join_room', (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined room: user_${userId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// Body parser
app.use(express.json());
// Twilio sends urlencoded data
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Enable CORS
app.use(cors());

const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/bookings', bookingRoutes);

app.get('/api/debug', (req, res) => {
  res.json({
    pid: process.pid,
    cwd: process.cwd(),
    dirname: __dirname,
    time: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Smart Local Service Finder API is running...');
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.IO`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
