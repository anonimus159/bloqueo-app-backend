import { Request, Response } from 'express';
import crypto from 'crypto';
import db from '../config/database';

// Clave secreta compartida con la pasarela de pagos para firmas HMAC
const PAYMENTS_WEBHOOK_SECRET = process.env.PAYMENTS_WEBHOOK_SECRET || 'secret_webhook_signature_codecraft';
const DEVICE_TOKEN_SECRET = process.env.DEVICE_TOKEN_SECRET || 'device_secret';

/**
 * Recibe y procesa notificaciones de pago automáticas (Webhooks)
 * de pasarelas como MercadoPago o Stripe.
 */
export const receiveWebhook = async (req: Request, res: Response): Promise<any> => {
  const hmacHeader = req.headers['x-signature'] as string; // Firma enviada por la pasarela
  
  if (!hmacHeader) {
    return res.status(401).json({ error: 'Firma de webhook no proporcionada.' });
  }

  try {
    const rawBody = JSON.stringify(req.body);
    
    // Verificar firma HMAC SHA256 para garantizar que el pago proviene de la pasarela legítima
    const computedSignature = crypto.createHmac('sha256', PAYMENTS_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    // Validación de la firma de seguridad
    if (computedSignature !== hmacHeader) {
      console.warn('[ALERTA SEGURIDAD] Intento de suplantación de Webhook de pagos detectado.');
      return res.status(401).json({ error: 'Firma HMAC inválida.' });
    }

    const { transaction_id, status, device_id, amount } = req.body;

    // Solo procesar pagos aprobados
    if (status !== 'approved') {
      return res.status(200).json({ message: 'Pago recibido pero no aprobado. Estado: ' + status });
    }

    // 1. Validar que el dispositivo existe
    const deviceRes = await db.query('SELECT id, serial_number FROM devices WHERE id = $1', [device_id]);
    if (deviceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado para este pago.' });
    }

    const device = deviceRes.rows[0];

    // 2. Registrar el pago en la base de datos
    await db.query(
      `INSERT INTO payments (id, device_id, transaction_id, gateway, amount, status, payload)
       VALUES (uuid_generate_v4(), $1, $2, 'gateway_integrado', $3, $4, $5)`,
      [device.id, transaction_id, amount, status, JSON.stringify(req.body)]
    );

    // 3. Cambiar el estado del dispositivo a activo
    await db.query(
      "UPDATE devices SET status = 'active' WHERE id = $1",
      [device.id]
    );

    // 4. Encolar comando de desbloqueo ('unlock') firmado automáticamente
    const nonce = crypto.randomBytes(16).toString('hex');
    const signature = crypto.createHmac('sha256', DEVICE_TOKEN_SECRET)
      .update(`${device.serial_number}:unlock:${nonce}`)
      .digest('hex');

    await db.query(
      `INSERT INTO commands (device_id, type, status, signature, token, payload)
       VALUES ($1, 'unlock', 'pending', $2, $3, $4)`,
      [
        device.id, 
        signature, 
        nonce, 
        JSON.stringify({ reason: 'Pago de cuota verificado automáticamente por webhook.' })
      ]
    );

    console.log(`[PAGO EXITOSO] Dispositivo ${device.serial_number} reactivado de forma automática.`);

    return res.status(200).json({
      message: 'Pago procesado y dispositivo reactivado exitosamente.'
    });
  } catch (error) {
    console.error('Error al procesar el webhook de pagos:', error);
    return res.status(500).json({ error: 'Error interno al procesar el pago.' });
  }
};
