import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import apiRoutes from './routes/apiRoutes.js';
import { privacyGuard } from './middleware/privacyGuard.js';
import { db } from './database/db.js';
import { runSeeds } from './database/seed.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');

const app = express();
const PORT = process.env.PORT || 4000;

// Security & Privacy Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allow local dashboard integrations
}));

app.use(cors({
  origin: '*', // Research testing allows local frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '5mb' }));
app.use(privacyGuard);

// API Routing
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'Password Security Analysis System API',
    database: db.getDbType(),
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve built frontend assets in production / unified mode
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Boot and seed database
async function startServer() {
  try {
    await db.initialize();
    await runSeeds();

    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`  PASSWORD SECURITY ANALYSIS SYSTEM (PSAS) BACKEND   `);
      console.log(`  Listening on: http://localhost:${PORT}             `);
      console.log(`  Database Engine: ${db.getDbType().toUpperCase()}    `);
      console.log(`  Privacy Guard: ACTIVE (Zero Plaintext Logging)     `);
      console.log(`====================================================`);
    });
  } catch (err: any) {
    console.error('Critical failure during server startup:', err);
    process.exit(1);
  }
}

startServer();

export default app;
