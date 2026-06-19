import db from './src/config/database';

async function main() {
  try {
    await db.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(255);');
    console.log('fcm_token column added successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
