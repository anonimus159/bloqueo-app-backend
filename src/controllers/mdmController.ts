import { Request, Response } from 'express';
import * as plist from '../utils/plist';
import db from '../config/database';

// 1. Dynamic Enrollment Profile (.mobileconfig) Generator
export const enrollDevice = async (req: Request, res: Response) => {
  const host = req.headers.host || 'bloqueo-app-backend.onrender.com';
  const protocol = req.secure ? 'https' : 'http';
  const serverUrl = `${protocol}://${host}/api/v1/mdm`;

  const profile = {
    PayloadContent: [
      {
        PayloadDescription: 'Configura restricciones de seguridad empresarial para dispositivos financiados',
        PayloadDisplayName: 'Restricciones de Control CodeCraft',
        PayloadIdentifier: 'com.codecraft.control.restrictions',
        PayloadType: 'com.apple.applicationaccess',
        PayloadUUID: 'e9d3d3b0-fb54-47f9-86ab-d125dbb2c9ad',
        PayloadVersion: 1,
        allowAppRemoving: false,
        allowEraseContentAndSettings: false,
        allowAccountModification: false,
        allowFindMyFriendsModifications: false,
        allowPairing: false,
        allowAirplaneMode: true
      },
      {
        PayloadDescription: 'Configura la conexión MDM empresarial con el servidor de control',
        PayloadDisplayName: 'CodeCraft MDM Service',
        PayloadIdentifier: 'com.codecraft.control.mdmservice',
        PayloadType: 'com.apple.mdm',
        PayloadUUID: 'e5a1b32d-2095-46fd-82ab-ef89db8b32ad',
        PayloadVersion: 1,
        ServerURL: `${serverUrl}/command`,
        CheckInURL: `${serverUrl}/checkin`,
        Topic: 'com.codecraft.control.apns', // APNs Topic
        IdentityCertificateUUID: '3b827e7d-ccae-488f-9a10-2f78a2e5d95d',
        AccessRights: 8191 // Permisos completos de supervisión
      }
    ],
    PayloadDescription: 'Perfil MDM oficial de restricción y supervisión para la venta de terminales a crédito.',
    PayloadDisplayName: 'CodeCraft Supervisor Profile',
    PayloadIdentifier: 'com.codecraft.control.profile',
    PayloadOrganization: 'CodeCraft Programming Forge',
    PayloadRemovalDisallowed: true, // Bloquear desinstalación
    PayloadType: 'Configuration',
    PayloadUUID: '3b827e7d-ccae-488f-9a10-2f78a2e5d95d',
    PayloadVersion: 1
  };

  const xmlContent = plist.build(profile as any);
  res.set('Content-Type', 'application/x-apple-aspen-mobileconfig');
  res.set('Content-Disposition', 'attachment; filename="codecraft_mdm.mobileconfig"');
  res.status(200).send(xmlContent);
};

// 2. MDM Check-In Endpoint (/checkin)
export const handleCheckIn = async (req: any, res: Response): Promise<any> => {
  const mdmData = req.body;
  if (!mdmData || !mdmData.MessageType) {
    console.warn('CheckIn MDM recibido sin MessageType');
    return res.status(400).send('Bad Request');
  }

  const { MessageType, UDID, SerialNumber, PushMagic } = mdmData;
  console.log(`[MDM CheckIn] Tipo: ${MessageType}, UDID: ${UDID}, Serial: ${SerialNumber}`);

  try {
    if (MessageType === 'Authenticate') {
      // Registrar o actualizar dispositivo iOS pre-autenticado
      const query = `
        INSERT INTO devices (serial_number, brand, model, udid, device_type, status)
        VALUES ($1, 'APPLE', 'iPhone (MDM)', $2, 'ios', 'active')
        ON CONFLICT (serial_number) 
        DO UPDATE SET udid = EXCLUDED.udid, device_type = 'ios'
        RETURNING id, serial_number;
      `;
      await db.query(query, [SerialNumber || `IOS-${UDID.substring(0, 10)}`, UDID]);
      
    } else if (MessageType === 'TokenUpdate') {
      // Actualizar tokens APNs enviados por el iPhone
      const query = `
        UPDATE devices 
        SET push_magic = $1, last_sync_at = CURRENT_TIMESTAMP
        WHERE udid = $2;
      `;
      await db.query(query, [PushMagic, UDID]);
    }

    // Retornar XML Plist vacío de confirmación
    const responseXml = plist.build({});
    res.set('Content-Type', 'application/xml');
    res.status(200).send(responseXml);
  } catch (err) {
    console.error('Error procesando MDM CheckIn:', err);
    res.status(500).send('Internal Server Error');
  }
};

// 3. Command Fetching & Result Processing Endpoint (/command)
export const handleCommand = async (req: any, res: Response): Promise<any> => {
  const mdmData = req.body;
  if (!mdmData || !mdmData.UDID) {
    console.warn('MDM Command consultado sin UDID válido');
    return res.status(400).send('Bad Request');
  }

  const { UDID, Status, CommandUUID } = mdmData;
  console.log(`[MDM Command] UDID: ${UDID}, Status: ${Status}, CommandUUID: ${CommandUUID}`);

  try {
    // Buscar dispositivo en base de datos
    const deviceRes = await db.query('SELECT id, status FROM devices WHERE udid = $1', [UDID]);
    if (deviceRes.rows.length === 0) {
      console.warn(`[MDM Command] Dispositivo con UDID ${UDID} no encontrado`);
      return res.status(200).send(plist.build({})); // Retornar vacío
    }
    const device = deviceRes.rows[0];

    // Si el dispositivo está respondiendo a un comando anterior
    if (Status === 'Acknowledged' && CommandUUID) {
      await db.query(
        "UPDATE commands SET status = 'executed', executed_at = CURRENT_TIMESTAMP WHERE token = $1",
        [CommandUUID]
      );
    } else if (Status === 'Error' && CommandUUID) {
      await db.query(
        "UPDATE commands SET status = 'failed', executed_at = CURRENT_TIMESTAMP WHERE token = $1",
        [CommandUUID]
      );
    }

    // Buscar el siguiente comando pendiente para el dispositivo
    const cmdRes = await db.query(
      `SELECT id, type, token, payload 
       FROM commands 
       WHERE device_id = $1 AND status = 'pending' 
       ORDER BY created_at ASC LIMIT 1`,
      [device.id]
    );

    if (cmdRes.rows.length === 0) {
      // No hay comandos pendientes, responder vacío (HTTP 200 sin comando)
      return res.status(200).send(plist.build({}));
    }

    const nextCmd = cmdRes.rows[0];

    // Marcar comando como "sent" (enviado)
    await db.query("UPDATE commands SET status = 'sent' WHERE id = $1", [nextCmd.id]);

    // Traducir comando interno a payload oficial MDM de Apple
    let appleCommandPayload: any = {};
    if (nextCmd.type === 'lock') {
      appleCommandPayload = {
        Command: {
          RequestType: 'DeviceLock',
          Message: nextCmd.payload?.message || 'Este equipo ha sido suspendido por administración.',
          PhoneNumber: nextCmd.payload?.phone || ''
        },
        CommandUUID: nextCmd.token
      };
    } else if (nextCmd.type === 'unlock') {
      // En iOS, el desbloqueo remoto se asocia a remover el perfil restrictivo o limpiar la clave
      appleCommandPayload = {
        Command: {
          RequestType: 'ClearPasscode'
        },
        CommandUUID: nextCmd.token
      };
    } else if (nextCmd.type === 'wipe') {
      appleCommandPayload = {
        Command: {
          RequestType: 'EraseDevice'
        },
        CommandUUID: nextCmd.token
      };
    } else {
      // Fallback a un perfil de info básica
      appleCommandPayload = {
        Command: {
          RequestType: 'ProfileList'
        },
        CommandUUID: nextCmd.token
      };
    }

    res.set('Content-Type', 'application/xml');
    res.status(200).send(plist.build(appleCommandPayload));
  } catch (err) {
    console.error('Error procesando comando MDM:', err);
    res.status(500).send('Internal Server Error');
  }
};
