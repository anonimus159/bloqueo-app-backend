import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import deviceRoutes from './routes/deviceRoutes';
import paymentRoutes from './routes/paymentRoutes';
import mdmRoutes from './routes/mdmRoutes';
import { rawBodyParser } from './middlewares/plistMiddleware';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(rawBodyParser); // Middleware para parsear XML Plist de Apple MDM
app.use(express.json());

// Ruta para descargar el APK de Android de forma directa
app.get('/app-debug.apk', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/app-debug.apk'));
});

// Registrar Rutas de la API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/devices', deviceRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/mdm', mdmRoutes);

// Endpoint de verificación de estado (Health Check)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Manejador de errores global
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error no controlado:', err.stack);
  res.status(500).json({ error: 'Ocurrió un error interno en el servidor.' });
});

// Arrancar servidor
app.listen(PORT as number, '0.0.0.0', () => {
  console.log(`Servidor de control de dispositivos iniciado en el puerto ${PORT} (Entorno: ${process.env.NODE_ENV || 'development'})`);
});

// Trigger redeploy: force fresh clean rebuild on Render
