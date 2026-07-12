import db from './src/config/database';

async function main() {
  const deviceId = 11; // El ID de nuestro emulador registrado
  console.log(`Encolando comando de BLOQUEO (lock) para el emulador (ID: ${deviceId})...`);

  try {
    // 1. Actualizar estado lógico del dispositivo a 'locked'
    await db.query("UPDATE devices SET status = 'locked' WHERE id = $1", [deviceId]);

    // 2. Insertar comando 'lock' pendiente
    const insertQuery = `
      INSERT INTO commands (device_id, type, status, signature, token, payload)
      VALUES ($1, 'lock', 'pending', 'mock_signature', 'mock_nonce', '{"message": "Su pago está vencido. Favor de regularizar su situación."}')
      RETURNING id, status;
    `;
    const res = await db.query(insertQuery, [deviceId]);
    console.log('¡Comando de bloqueo encolado con éxito en la base de datos!', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error al encolar bloqueo:', err);
    process.exit(1);
  }
}

main();
