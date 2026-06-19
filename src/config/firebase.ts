import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';
import fs from 'fs';

let credentialConfig;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Leer desde variable de entorno en Render
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    credentialConfig = cert(serviceAccount);
  } catch (error) {
    console.error("Error al parsear FIREBASE_SERVICE_ACCOUNT:", error);
  }
} else {
  // Leer desde archivo en local
  const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');
  if (fs.existsSync(serviceAccountPath)) {
    credentialConfig = cert(serviceAccountPath);
  }
}

const app = initializeApp({
  credential: credentialConfig,
});

export const messaging = getMessaging(app);
