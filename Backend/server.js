import path from 'path';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import connectDB from './utils/db.js';
import userRoutes from './routes/user.routes.js';
import postRoutes from './routes/post.routes.js';
import messageRoutes from './routes/message.routes.js';
import storyRoutes from './routes/story.routes.js';
import { app, server } from './socket/socket.js';

dotenv.config();

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV?.toLowerCase();
const __dirname = path.resolve();

/* ----------------------------- Middlewares ----------------------------- */

app.use(
  cors({
    origin: process.env.URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/* ------------------------------- Routes -------------------------------- */

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/post', postRoutes);
app.use('/api/v1/message', messageRoutes);
app.use('/api/v1/story', storyRoutes);

/* --------------------------- Health-check API --------------------------- */

app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({
    message: 'Server is running',
    success: true,
    environment: NODE_ENV || 'development',
  });
});

/* ------------------------- Frontend Application ------------------------- */

if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'Frontend', 'dist');

  app.use(express.static(frontendPath));

  /*
   * Send React's index.html only for non-API GET requests.
   * This prevents invalid API requests from receiving HTML.
   */
  app.get(/^(?!\/api\/).*/, (req, res, next) => {
    res.sendFile(path.join(frontendPath, 'index.html'), (error) => {
      if (error) {
        next(error);
      }
    });
  });
} else {
  app.get('/', (req, res) => {
    return res.status(200).json({
      message: "I'm coming from the backend",
      success: true,
    });
  });
}

/* ------------------------- Unknown API Routes --------------------------- */

app.use('/api', (req, res) => {
  return res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`,
    success: false,
  });
});

/* -------------------------- Global Error Handler ------------------------ */

app.use((error, req, res, next) => {
  console.error('Unhandled server error:', error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
    success: false,
  });
});

/* ----------------------------- Start Server ----------------------------- */

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
      console.log(`Environment: ${NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();

/* -------------------------- Process Error Safety ------------------------ */

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});