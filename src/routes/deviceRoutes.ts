import { Router } from 'express';
import { 
  registerDevice, 
  getDevices, 
  queueCommand, 
  deviceCheckIn, 
  confirmCommand 
} from '../controllers/deviceController';
import { authenticateAdmin } from '../middlewares/authMiddleware';

const router = Router();

// Rutas Administrativas (Protegidas por JWT)
router.post('/register', authenticateAdmin, registerDevice);
router.get('/', authenticateAdmin, getDevices);
router.post('/:deviceId/command', authenticateAdmin, queueCommand);

// Rutas del Cliente Móvil (Autenticadas internamente con tokens de hardware)
router.post('/check-in', deviceCheckIn);
router.post('/confirm-command', confirmCommand);

export default router;
