import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const registerAdmin = async (req: Request, res: Response): Promise<any> => {
  const { email, password, name, role } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: email, password, name' });
  }

  try {
    // Verificar si el administrador ya existe
    const existing = await db.query('SELECT id FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    // Hashear contraseña de forma segura
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insertar administrador en la base de datos
    const result = await db.query(
      'INSERT INTO admins (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, passwordHash, name, role || 'admin']
    );

    return res.status(201).json({
      message: 'Administrador registrado exitosamente.',
      admin: result.rows[0],
    });
  } catch (error) {
    console.error('Error al registrar administrador:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el registro.' });
  }
};

export const loginAdmin = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan campos obligatorios: email, password' });
  }

  try {
    // Buscar administrador por email
    const result = await db.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const admin = result.rows[0];

    // Verificar contraseña con bcrypt
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Generar Token JWT con expiración de 8 horas
    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      message: 'Inicio de sesión exitoso.',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Error en login de administrador:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el login.' });
  }
};
