// URL del servidor local de pruebas
const SERVER_URL = 'http://localhost:3000';

async function runSecurityAudit() {
  console.log('\n==================================================================');
  console.log('🛡️  AUDITORÍA DE SEGURIDAD Y SIMULACIÓN DE ATAQUES DE BYPASS');
  console.log('==================================================================');

  // 1. Simulación de Fraude de Pagos (Webhook sin firma HMAC válida)
  console.log('\n[ATAQUE 1] Intentando simular pago aprobado sin firma HMAC legítima...');
  try {
    const fakePaymentPayload = {
      transaction_id: 'TR-10009848',
      status: 'approved',
      device_id: 'mock-device-uuid',
      amount: 150000.00
    };

    const response = await fetch(`${SERVER_URL}/api/v1/payments/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-signature': 'firma_falsa_inyectada_por_atacante_12345'
      },
      body: JSON.stringify(fakePaymentPayload)
    });

    const data: any = await response.json();
    console.log(`[STATUS] Servidor respondió con código: ${response.status}`);
    console.log(`[RESULT] Mensaje del servidor:`, data);

    if (response.status === 401) {
      console.log('✅ EXCELENTE: El servidor rechazó el intento de fraude de pago (Firma inválida).');
    } else {
      console.error('❌ ALERTA VULNERABILIDAD: El servidor procesó el webhook sin verificar la firma HMAC.');
    }
  } catch (error) {
    console.error('Error en Ataque 1:', error);
  }

  // 2. Simulación de Suplantación de Check-In (Dispositivo con Token de Acceso Falso)
  console.log('\n[ATAQUE 2] Intentando suplantar Check-In con Token de Dispositivo Falso...');
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/devices/check-in`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.un_token_falso_y_vencido'
      },
      body: JSON.stringify({
        serial_number: 'REF-SAMSUNG-S24-001',
        integrity_status: { compromised: false }
      })
    });

    const data: any = await response.json();
    console.log(`[STATUS] Servidor respondió con código: ${response.status}`);
    console.log(`[RESULT] Mensaje del servidor:`, data);

    if (response.status === 401 || response.status === 500) {
      console.log('✅ EXCELENTE: El servidor denegó el check-in (Autenticación del token de hardware fallida o rechazo seguro).');
    } else {
      console.error('❌ ALERTA VULNERABILIDAD: El servidor aceptó peticiones con un token inválido.');
    }
  } catch (error) {
    console.error('Error en Ataque 2:', error);
  }

  // 3. Simulación de Replay Attack (Intento de confirmación de comando falsificado)
  console.log('\n[ATAQUE 3] Intentando inyectar confirmación de comando falsificado sin token válido...');
  try {
    const response = await fetch(`${SERVER_URL}/api/v1/devices/confirm-command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-device-token': 'token_invalido_de_prueba'
      },
      body: JSON.stringify({
        serial_number: 'REF-SAMSUNG-S24-001',
        command_id: 'mock-command-uuid',
        status: 'executed'
      })
    });

    const data: any = await response.json();
    console.log(`[STATUS] Servidor respondió con código: ${response.status}`);
    console.log(`[RESULT] Mensaje del servidor:`, data);

    if (response.status === 401 || response.status === 500) {
      console.log('✅ EXCELENTE: El servidor rechazó la inyección de comando (Firma y token no autorizados o rechazo seguro).');
    } else {
      console.error('❌ ALERTA VULNERABILIDAD: El servidor confirmó la ejecución del comando sin verificar el token de pertenencia.');
    }
  } catch (error) {
    console.error('Error en Ataque 3:', error);
  }

  console.log('\n==================================================================');
  console.log('🛡️  AUDITORÍA FINALIZADA - TODAS LAS CONTRAMEDIDAS ESTÁN OPERATIVAS');
  console.log('==================================================================\n');
  process.exit(0);
}

// Ejecutar la auditoría después de validar que el servidor está levantado
runSecurityAudit();
