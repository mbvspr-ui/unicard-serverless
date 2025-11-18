import { Router } from 'express';
import { getStates, getDistricts } from '../controllers/locations.js';

const router = Router();

// Public routes - no authentication required
router.get('/states', getStates);
router.get('/districts/:state', getDistricts);

export default router;
