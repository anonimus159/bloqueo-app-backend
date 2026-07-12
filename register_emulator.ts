import db from './src/config/database';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const DEVICE_TOKEN_SECRET = process.env.DEVICE_TOKEN_SECRET || 'device_secret';

async function main() {
  const serial_number = '3fcd588af194329c';
  const brand = 'GOOGLE';
  const model = 'sdk_gphone16k_x86_64';
  const imei = '123456789012345';
  const customer_name = 'Emulador Pixel 10 Pro';
  const customer_phone = '+1 555-0199';

  console.log(`Registrando dispositivo emulador: ${serial_number}...`);

  try {
    // Generar un token único y seguro para el dispositivo
    const rawToken = crypto.randomBytes(32).toString('hex');
    const deviceToken = jwt.sign({ serial_number, rand: rawToken }, DEVICE_TOKEN_SECRET);

    // Insertar o actualizar
    const query = `
      INSERT INTO devices (serial_number, imei, brand, model, customer_name, customer_phone, device_token, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
      ON CONFLICT (serial_number) 
      DO UPDATE SET 
        brand = EXCLUDED.brand,
        model = EXCLUDED.model,
        imei = EXCLUDED.imei,
        customer_name = EXCLUDED.customer_name,
        customer_phone = EXCLUDED.customer_phone
      RETURNING id, serial_number, status;
    `;

    const res = await db.query(query, [serial_number, imei, brand, model, customer_name, customer_phone, deviceToken]);
    console.log('¡Dispositivo registrado exitosamente en Supabase!', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error al registrar dispositivo:', err);
    process.exit(1);
  }
}

main();
