import bcrypt from 'bcryptjs';
import db from '../src/config/database';

async function main() {
  try {
    // 1. Asegurar que la tabla existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla "admins" verificada o creada correctamente.');

    const email = 'admin@codecraft.com';
    const password = 'AdminPassword123!';
    const name = 'Admin Principal';

    // 2. Verificar si ya existe
    const existing = await db.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log(`⚠️ El administrador ${email} ya existe en la base de datos.`);
      process.exit(0);
    }

    // 3. Crear el hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Insertar el usuario
    await db.query(
      'INSERT INTO admins (email, password_hash, name, role) VALUES ($1, $2, $3, $4)',
      [email, passwordHash, name, 'admin']
    );

    console.log(`🎉 Administrador creado con éxito!`);
    console.log(`✉️  Email: ${email}`);
    console.log(`🔑 Contraseña: ${password}`);
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al crear el administrador:', err);
    process.exit(1);
  }
}

main();
