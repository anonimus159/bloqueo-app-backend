import db from './src/config/database';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'admin@codecraft.com';
  const newPassword = 'admin1234';
  
  console.log(`Actualizando contraseña para ${email}...`);

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newPassword, salt);
    
    const res = await db.query(
      'UPDATE admins SET password_hash = $1 WHERE email = $2 RETURNING id, email',
      [hash, email]
    );

    if (res.rows.length === 0) {
      // Si no existe, lo insertamos
      const insertQuery = `
        INSERT INTO admins (email, password_hash, name, role)
        VALUES ($1, $2, 'Admin Principal', 'admin')
        RETURNING id, email;
      `;
      const insertRes = await db.query(insertQuery, [email, hash]);
      console.log('Usuario admin creado exitosamente:', insertRes.rows[0]);
    } else {
      console.log('Contraseña de administrador actualizada con éxito:', res.rows[0]);
    }
    
    console.log(`Credenciales listas:\nCorreo: ${email}\nContraseña: ${newPassword}`);
    process.exit(0);
  } catch (err) {
    console.error('Error al actualizar contraseña:', err);
    process.exit(1);
  }
}

main();
