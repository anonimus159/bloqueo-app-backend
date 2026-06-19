import { Router } from 'express';
import { receiveWebhook } from '../controllers/paymentController';

const router = Router();

router.post('/webhook', receiveWebhook);

export default router;
