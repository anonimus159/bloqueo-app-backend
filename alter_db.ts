import db from './src/config/database';

async function main() {
  try {
    await db.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(255);');
    await db.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS next_payment_deadline TIMESTAMP WITH TIME ZONE;');
    console.log('Database alteration queries completed successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
