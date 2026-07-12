import db from './src/config/database';

async function main() {
  try {
    const res = await db.query('SELECT id, serial_number, brand, model, status FROM devices');
    console.log('Dispositivos registrados en DB:');
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
