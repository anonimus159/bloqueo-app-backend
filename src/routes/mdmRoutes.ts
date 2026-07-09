import { Router } from 'express';
import { enrollDevice, handleCheckIn, handleCommand } from '../controllers/mdmController';

const router = Router();

// Endpoint para descargar el perfil de inscripción .mobileconfig
router.get('/enroll', enrollDevice);

// Endpoint de Check-In del protocolo MDM de Apple (Authenticate y TokenUpdate)
router.put('/checkin', handleCheckIn);

// Endpoint de solicitud de comandos del dispositivo iOS
router.put('/command', handleCommand);

export default router;
