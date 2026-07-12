import db from './src/config/database';

async function main() {
  const deviceId = 6; // El ID de nuestro emulador registrado
  // Establecer fecha límite para dentro de 60 segundos (1 minuto)
  const deadline = new Date(Date.now() + 60 * 1000);
  const deadlineISO = deadline.toISOString();

  console.log(`Estableciendo fecha límite de pago para el dispositivo ${deviceId} a: ${deadlineISO}...`);

  try {
    // 1. Asegurar que el estado es 'active' y establecer la fecha límite de pago
    const query = `
      UPDATE devices 
      SET status = 'active', next_payment_deadline = $1 
      WHERE id = $2 
      RETURNING id, serial_number, status, next_payment_deadline;
    `;
    const res = await db.query(query, [deadlineISO, deviceId]);
    
    // 2. Limpiar comandos pendientes anteriores para que no interfieran
    await db.query('DELETE FROM commands WHERE device_id = $1', [deviceId]);

    console.log('¡Dispositivo actualizado en la base de datos!', res.rows[0]);
    console.log('\n>>> PASO SIGUIENTE PARA EL MÓVIL:');
    console.log('1. Abre la app en el emulador una vez para que reciba la nueva fecha límite y programe la alarma.');
    console.log('2. Puedes apagar el servidor local (o el internet en el emulador).');
    console.log('3. Espera 60 segundos sin hacer nada. El dispositivo se debe bloquear SOLO.');
    process.exit(0);
  } catch (err) {
    console.error('Error al actualizar fecha límite:', err);
    process.exit(1);
  }
}

main();
