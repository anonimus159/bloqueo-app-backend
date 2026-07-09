import db from './src/config/database';

async function main() {
  try {
    await db.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS fcm_token VARCHAR(255);');
    await db.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS next_payment_deadline TIMESTAMP WITH TIME ZONE;');
    await db.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS udid VARCHAR(100) UNIQUE;');
    await db.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS push_magic VARCHAR(100);');
    await db.query('ALTER TABLE devices ADD COLUMN IF NOT EXISTS device_type VARCHAR(20) DEFAULT \'android\' CHECK (device_type IN (\'android\', \'ios\'));');
    await db.query('ALTER TABLE devices ALTER COLUMN device_token DROP NOT NULL;');
    console.log('Database alteration queries completed successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
