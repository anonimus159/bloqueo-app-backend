import db from './src/config/database';

async function main() {
  try {
    const res = await db.query('SELECT id, email, name, role FROM admins');
    console.log('Administradores en DB:');
    console.log(res.rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
