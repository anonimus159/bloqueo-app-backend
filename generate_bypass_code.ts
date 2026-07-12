import crypto from 'crypto';

function getBypassCodeForDate(serial: string, date: Date): string {
  // Formatear fecha local como yyyyMMdd
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}${mm}${dd}`;

  const input = serial + 'CodeCraftBypass2026' + dateStr;
  const hash = crypto.createHash('md5').update(input).digest();
  
  // Leer los primeros 4 bytes como entero de 32 bits con signo big-endian
  const value = hash.readInt32BE(0);
  const code = Math.abs(value) % 1000000;
  return String(code).padStart(6, '0');
}

async function main() {
  // Obtener serie de los argumentos o usar la del emulador por defecto
  const serial = process.argv[2] || '58e625a7f1ff4fbd';
  console.log(`=======================================================`);
  console.log(`GENERADOR DE CÓDIGOS DE DESBLOQUEO OFFLINE (OTP)`);
  console.log(`Serie del Dispositivo: "${serial}"`);
  console.log(`=======================================================`);

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  console.log(`📅 CÓDIGO AYER:   ${getBypassCodeForDate(serial, yesterday)}`);
  console.log(`👉 CÓDIGO HOY:    ${getBypassCodeForDate(serial, now)}`);
  console.log(`📅 CÓDIGO MAÑANA: ${getBypassCodeForDate(serial, tomorrow)}`);
  console.log(`=======================================================`);
  console.log(`Indícale al cliente el código de HOY.`);
  console.log(`Si el dispositivo tiene desajuste horario, cualquiera funcionará.`);
}

main();
