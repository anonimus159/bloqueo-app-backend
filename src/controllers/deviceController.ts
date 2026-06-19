import { Request, Response } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../config/database';
import { messaging } from '../config/firebase';
import { getServerKeys } from '../config/keys';

const DEVICE_TOKEN_SECRET = process.env.DEVICE_TOKEN_SECRET || 'device_secret';

// 1. Registro de Dispositivo (Administrador)
export const registerDevice = async (req: Request, res: Response): Promise<any> => {
  const { serial_number, imei, brand, model, customer_name, customer_phone, next_payment_deadline } = req.body;

  if (!serial_number || !brand || !model) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: serial_number, brand, model' });
  }

  try {
    // Verificar duplicado
    const existing = await db.query('SELECT id, device_token FROM devices WHERE serial_number = $1', [serial_number]);
    if (existing.rows.length > 0) {
      // Si ya existe, actualizamos los detalles del dispositivo (UPSERT lógico)
      const deviceId = existing.rows[0].id;
      const result = await db.query(
        `UPDATE devices 
         SET imei = $1, brand = $2, model = $3, customer_name = $4, customer_phone = $5, next_payment_deadline = $6, last_sync_at = CURRENT_TIMESTAMP
         WHERE id = $7
         RETURNING id, serial_number, brand, model, status, device_token, created_at, next_payment_deadline`,
        [imei, brand, model, customer_name, customer_phone, next_payment_deadline || null, deviceId]
      );

      return res.status(200).json({
        message: 'Dispositivo actualizado exitosamente.',
        device: result.rows[0],
      });
    }

    // Generar un token único y seguro para el dispositivo
    const rawToken = crypto.randomBytes(32).toString('hex');
    const deviceToken = jwt.sign({ serial_number, rand: rawToken }, DEVICE_TOKEN_SECRET);

    const result = await db.query(
      `INSERT INTO devices (serial_number, imei, brand, model, customer_name, customer_phone, device_token, status, next_payment_deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8)
       RETURNING id, serial_number, brand, model, status, device_token, created_at, next_payment_deadline`,
      [serial_number, imei, brand, model, customer_name, customer_phone, deviceToken, next_payment_deadline || null]
    );

    return res.status(201).json({
      message: 'Dispositivo registrado exitosamente.',
      device: result.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar dispositivo:', error);
    return res.status(500).json({ error: 'Error interno del servidor al registrar el dispositivo.' });
  }
};

// 2. Listar Dispositivos (Administrador)
export const getDevices = async (_req: Request, res: Response): Promise<any> => {
  try {
    const result = await db.query('SELECT id, serial_number, imei, brand, model, status, customer_name, customer_phone, last_sync_at, created_at FROM devices ORDER BY created_at DESC');
    return res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener dispositivos:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de dispositivos.' });
  }
};

// 3. Encolar Comando (Administrador)
export const queueCommand = async (req: Request, res: Response): Promise<any> => {
  const { deviceId } = req.params;
  const { type, payload } = req.body; // type: 'lock', 'unlock', 'wipe'

  if (!type || !['lock', 'unlock', 'wipe'].includes(type)) {
    return res.status(400).json({ error: 'Tipo de comando no válido. Debe ser: lock, unlock, wipe.' });
  }

  try {
    // Validar que el dispositivo existe
    const deviceRes = await db.query('SELECT id, serial_number, fcm_token FROM devices WHERE id = $1', [deviceId]);
    if (deviceRes.rows.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado.' });
    }

    const device = deviceRes.rows[0];
    const nonce = crypto.randomBytes(16).toString('hex');

    // Generar firma asimétrica real (ECDSA P-256)
    const { privateKey } = getServerKeys();
    const sign = crypto.createSign('SHA256');
    sign.update(`${device.serial_number}:${type}:${nonce}`);
    sign.end();
    const signature = sign.sign(privateKey, 'hex');

    const result = await db.query(
      `INSERT INTO commands (device_id, type, status, signature, token, payload)
       VALUES ($1, $2, 'pending', $3, $4, $5)
       RETURNING id, device_id, type, status, signature, token, payload, created_at`,
      [deviceId, type, signature, nonce, JSON.stringify(payload || {})]
    );

    // FIX FOR DEMO: Immediately update device status when a lock/unlock command is sent
    let newDeviceStatus = 'active';
    if (type === 'lock') newDeviceStatus = 'locked';
    else if (type === 'unlock') newDeviceStatus = 'active';
    else if (type === 'wipe') newDeviceStatus = 'suspended';

    await db.query(
      'UPDATE devices SET status = $1 WHERE id = $2',
      [newDeviceStatus, deviceId]
    );

    // Enviar notificación Push (FCM) si el dispositivo tiene token registrado
    if (device.fcm_token) {
      try {
        await messaging.send({
          token: device.fcm_token,
          data: {
            action: type, // 'lock', 'unlock', 'wipe'
          },
          android: {
            priority: 'high',
          }
        });
        console.log(`Push FCM enviado al dispositivo ${device.serial_number}`);
      } catch (fcmError) {
        console.error('Error enviando Push FCM:', fcmError);
      }
    }

    return res.status(201).json({
      message: 'Comando encolado exitosamente.',
      command: result.rows[0],
    });
  } catch (error) {
    console.error('Error al encolar comando:', error);
    return res.status(500).json({ error: 'Error al encolar el comando.' });
  }
};

// 4. Check-In de Dispositivo (Cliente Móvil)
export const deviceCheckIn = async (req: Request, res: Response): Promise<any> => {
  try {
    const { serial_number, fcm_token } = req.body;
    
    // Buscar el dispositivo en la base de datos
    const deviceResult = await db.query(
      'SELECT id, status, next_payment_deadline FROM devices WHERE serial_number = $1',
      [serial_number]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado.' });
    }

    const device = deviceResult.rows[0];

    // Actualizar fcm_token si fue proporcionado
    if (fcm_token) {
      await db.query(
        'UPDATE devices SET fcm_token = $1 WHERE id = $2',
        [fcm_token, device.id]
      );
    }

    // Buscar comandos pendientes
    const commandsResult = await db.query(
      'SELECT id, type, payload FROM commands WHERE device_id = $1 AND status = $2 ORDER BY created_at ASC',
      [device.id, 'pending']
    );

    return res.status(200).json({
      status: device.status,
      next_payment_deadline: device.next_payment_deadline,
      commands: commandsResult.rows
    });
  } catch (error) {
    console.error('Error al procesar check-in:', error);
    return res.status(500).json({ error: 'Error del servidor en check-in.' });
  }
};

// 5. Confirmación de Ejecución de Comando (Cliente Móvil)
export const confirmCommand = async (req: Request, res: Response): Promise<any> => {
  const deviceToken = req.headers['x-device-token'] as string;
  const { serial_number, command_id, status } = req.body; // status: 'executed' o 'failed'

  if (!deviceToken || !serial_number || !command_id || !status) {
    return res.status(400).json({ error: 'Faltan parámetros obligatorios: serial_number, command_id, status.' });
  }

  try {
    // Validar dispositivo
    const deviceRes = await db.query(
      'SELECT id FROM devices WHERE serial_number = $1 AND device_token = $2',
      [serial_number, deviceToken]
    );

    if (deviceRes.rows.length === 0) {
      return res.status(401).json({ error: 'Autenticación fallida.' });
    }

    const device = deviceRes.rows[0];

    // Buscar comando y validar pertenencia
    const commandRes = await db.query(
      'SELECT id, type FROM commands WHERE id = $1 AND device_id = $2',
      [command_id, device.id]
    );

    if (commandRes.rows.length === 0) {
      return res.status(404).json({ error: 'Comando no encontrado para este dispositivo.' });
    }

    const command = commandRes.rows[0];
    const newStatus = status === 'executed' ? 'executed' : 'failed';

    // Actualizar comando
    await db.query(
      `UPDATE commands 
       SET status = $1, executed_at = CURRENT_TIMESTAMP 
       WHERE id = $2`,
      [newStatus, command.id]
    );

    // Si el comando se ejecutó con éxito, actualizar el estado lógico del dispositivo en la DB
    if (newStatus === 'executed') {
      let newDeviceStatus = 'active';
      if (command.type === 'lock') newDeviceStatus = 'locked';
      else if (command.type === 'unlock') newDeviceStatus = 'active';
      else if (command.type === 'wipe') newDeviceStatus = 'suspended';

      await db.query(
        'UPDATE devices SET status = $1 WHERE id = $2',
        [newDeviceStatus, device.id]
      );
    }

    return res.status(200).json({
      message: 'Ejecución del comando confirmada y registrada en el servidor.'
    });
  } catch (error) {
    console.error('Error al confirmar ejecución de comando:', error);
    return res.status(500).json({ error: 'Error al registrar la confirmación del comando.' });
  }
};
