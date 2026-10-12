import { Router } from 'express';
import multer from 'multer';
import { AuthController } from '../controllers/authController.js';
import { BreachController } from '../controllers/breachController.js';
import { AuditController } from '../controllers/auditController.js';
import { LogController } from '../controllers/logController.js';
import { ResearchController } from '../controllers/researchController.js';
import { SettingsController } from '../controllers/settingsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit for up to 10k rows
});

const router = Router();

// --- PUBLIC PRIVACY-PRESERVING ENDPOINTS ---
router.post('/auth/login', AuthController.login);
router.get('/breach/check/:hash', BreachController.checkHash);
router.post('/logs/record', LogController.recordLog);
router.post('/research/usability/record', ResearchController.recordUsabilityTrial);
router.get('/settings', SettingsController.getSettings);

// --- PROTECTED ADMINISTRATIVE ENDPOINTS ---
router.get('/auth/me', authMiddleware, AuthController.me);

// Corpus Management
router.get('/admin/corpus/stats', authMiddleware, BreachController.getStats);
router.post('/admin/corpus/entry', authMiddleware, BreachController.addEntry);
router.post('/admin/corpus/verify', authMiddleware, BreachController.verifyIntegrity);

// Bulk Auditing
router.post('/admin/audit/upload', authMiddleware, upload.single('file'), AuditController.processBulkAudit);
router.get('/admin/audit/reports', authMiddleware, AuditController.getReports);

// Telemetry & Logs
router.get('/admin/logs', authMiddleware, LogController.getLogs);
router.get('/admin/logs/stats', authMiddleware, LogController.getLogStats);

// Research Benchmarking & Usability Analysis
router.post('/admin/research/run-benchmark', authMiddleware, ResearchController.runBenchmark);
router.get('/admin/research/usability/stats', authMiddleware, ResearchController.getUsabilityStats);

// System Settings
router.post('/admin/settings', authMiddleware, SettingsController.updateSettings);

export default router;
