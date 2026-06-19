import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import path from 'path';

const serviceAccountPath = path.join(__dirname, '../../firebase-service-account.json');

const app = initializeApp({
  credential: cert(serviceAccountPath),
});

export const messaging = getMessaging(app);
