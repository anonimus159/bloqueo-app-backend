import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const keysFilePath = path.join(__dirname, 'server_keys.json');

interface KeyPair {
  publicKey: string;
  privateKey: string;
}

let keyPair: KeyPair;

export function getServerKeys(): KeyPair {
  if (keyPair) return keyPair;

  if (fs.existsSync(keysFilePath)) {
    const data = fs.readFileSync(keysFilePath, 'utf-8');
    keyPair = JSON.parse(data);
    return keyPair;
  }

  // Generar un par de claves reales ECDSA (Curva P-256)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  keyPair = { publicKey, privateKey };
  
  // Guardar las claves para persistencia
  fs.writeFileSync(keysFilePath, JSON.stringify(keyPair, null, 2));
  console.log('✅ Nuevo par de claves ECDSA generado y guardado en server_keys.json');

  return keyPair;
}

// Inicializar al importar
getServerKeys();
