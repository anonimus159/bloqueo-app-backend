import db from './src/config/database';

async function main() {
  const deviceId = 11; // El ID de nuestro emulador registrado
  console.log(`Encolando comando de DESBLOQUEO (unlock) para el emulador (ID: ${deviceId})...`);

  try {
    // 1. Actualizar estado lógico del dispositivo a 'active'
    await db.query("UPDATE devices SET status = 'active' WHERE id = $1", [deviceId]);

    // 2. Insertar comando 'unlock' pendiente
    const insertQuery = `
      INSERT INTO commands (device_id, type, status, signature, token, payload)
      VALUES ($1, 'unlock', 'pending', 'mock_signature', 'mock_nonce', '{}')
      RETURNING id, status;
    `;
    const res = await db.query(insertQuery, [deviceId]);
    console.log('¡Comando de desbloqueo encolado con éxito en la base de datos!', res.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error al encolar desbloqueo:', err);
    process.exit(1);
  }
}

main();
