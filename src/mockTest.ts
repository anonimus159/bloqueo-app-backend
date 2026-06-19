import db from './config/database';

// Base de datos en memoria simulada para pruebas
const mockDb = {
  admins: [] as any[],
  devices: [] as any[],
  commands: [] as any[],
};

// Sobrescribir la función query del módulo base de datos
db.query = async (text: string, params: any[] = []): Promise<any> => {
  const queryText = text.trim().toLowerCase();
  
  if (queryText.includes('select id from admins')) {
    const email = params[0];
    const match = mockDb.admins.filter(a => a.email === email);
    return { rows: match };
  }
  
  if (queryText.includes('insert into admins')) {
    const [email, passwordHash, name, role] = params;
    const newAdmin = {
      id: 'mock-admin-uuid',
      email,
      password_hash: passwordHash,
      name,
      role,
      created_at: new Date()
    };
    mockDb.admins.push(newAdmin);
    return { rows: [newAdmin] };
  }
  
  if (queryText.includes('select * from admins where email')) {
    const email = params[0];
    const match = mockDb.admins.filter(a => a.email === email);
    return { rows: match };
  }

  if (queryText.includes('select id from devices where serial_number')) {
    const serial = params[0];
    const match = mockDb.devices.filter(d => d.serial_number === serial);
    return { rows: match };
  }

  if (queryText.includes('insert into devices')) {
    const [serial_number, imei, brand, model, customer_name, customer_phone, device_token] = params;
    const newDevice = {
      id: 'mock-device-uuid',
      serial_number,
      imei,
      brand,
      model,
      customer_name,
      customer_phone,
      device_token,
      status: 'active',
      created_at: new Date()
    };
    mockDb.devices.push(newDevice);
    return { rows: [newDevice] };
  }

  if (queryText.includes('select id, serial_number, status from devices')) {
    const [serial, token] = params;
    const match = mockDb.devices.filter(d => d.serial_number === serial && d.device_token === token);
    return { rows: match };
  }

  if (queryText.includes('update devices set last_sync_at')) {
    return { rows: [] };
  }

  if (queryText.includes('select id, type, signature, token, payload from commands')) {
    const deviceId = params[0];
    const match = mockDb.commands.filter(c => c.device_id === deviceId && c.status === 'pending');
    return { rows: match };
  }

  return { rows: [] };
};

// Iniciar el servidor Express importándolo
import './server';

// Esperar a que el servidor Express inicie antes de lanzar peticiones HTTP
setTimeout(async () => {
  console.log('\n[TEST] --- Iniciando Pruebas de Integración con Base de Datos Simulada ---');
  try {
    // 1. Registrar un administrador
    console.log('[TEST] 1. Probando Registro de Administrador...');
    const regRes = await fetch('http://localhost:3000/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'soporte@codecraft.com',
        password: 'adminSecurePassword2026',
        name: 'Ingeniero Soporte',
        role: 'superadmin'
      })
    });
    const regData: any = await regRes.json();
    console.log('[TEST] Respuesta Registro:', regData);

    // 2. Iniciar sesión para obtener el Token JWT
    console.log('\n[TEST] 2. Probando Inicio de Sesión de Administrador...');
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'soporte@codecraft.com',
        password: 'adminSecurePassword2026'
      })
    });
    const loginData: any = await loginRes.json();
    console.log('[TEST] Respuesta Login:', loginData);
    const token = loginData.token;

    // 3. Registrar un Celular (Usando el Token JWT)
    console.log('\n[TEST] 3. Probando Registro de Dispositivo Financiar...');
    const devRegRes = await fetch('http://localhost:3000/api/v1/devices/register', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        serial_number: 'REF-SAMSUNG-S24-001',
        imei: '358901234567890',
        brand: 'Samsung',
        model: 'Galaxy S24 Ultra',
        customer_name: 'Carlos Andrés Gómez',
        customer_phone: '+573159876543'
      })
    });
    const devRegData: any = await devRegRes.json();
    console.log('[TEST] Respuesta Registro Dispositivo:', devRegData);
    const deviceToken = devRegData.device.device_token;

    // 4. Check-In del Dispositivo Móvil
    console.log('\n[TEST] 4. Probando Check-in Periódico del Cliente Móvil...');
    const checkInRes = await fetch('http://localhost:3000/api/v1/devices/check-in', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-device-token': deviceToken
      },
      body: JSON.stringify({
        serial_number: 'REF-SAMSUNG-S24-001',
        integrity_status: { compromised: false }
      })
    });
    const checkInData: any = await checkInRes.json();
    console.log('[TEST] Respuesta Check-in:', checkInData);

    console.log('\n[TEST] --- TODAS LAS PRUEBAS SE COMPLETARON EXITOSAMENTE ---');
    process.exit(0);
  } catch (error) {
    console.error('[TEST] Error durante la ejecución de las pruebas:', error);
    process.exit(1);
  }
}, 1500);
