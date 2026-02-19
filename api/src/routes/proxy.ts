import { Router } from 'express';
import { proxyImage } from '../controllers/proxy.js';

const router = Router();

// Proxy image endpoint (no auth required for public images)
router.get('/image', proxyImage);

export default router;
