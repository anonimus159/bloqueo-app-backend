import * as plist from './src/utils/plist';

const BACKEND_URL = 'https://bloqueo-app-backend.onrender.com/api/v1/mdm';
const SIMULATED_UDID = 'SIMULATED-IPHONE-UDID-77777';
const SIMULATED_SERIAL = 'C39SIMULATED777';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendPlist(endpoint: string, payload: any) {
  const xml = plist.build(payload);
  const response = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/x-apple-aspen-mdm'
    },
    body: xml
  });
  
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  
  const text = await response.text();
  return text ? plist.parse(text) : {};
}

async function startSimulation() {
  console.clear();
  console.log('====================================================');
  console.log('📱 SIMULADOR DIGITAL DE DISPOSITIVO iOS (APPLE MDM)');
  console.log('====================================================');
  console.log(`UDID: ${SIMULATED_UDID}`);
  console.log(`Serie: ${SIMULATED_SERIAL}`);
  console.log(`Servidor Destino: ${BACKEND_URL}`);
  console.log('----------------------------------------------------');

  try {
    // 1. Simular Authenticate (Enrolamiento Fase 1)
    console.log('1. [Simulador] Enviando solicitud Authenticate (Inscripción)...');
    await sendPlist('checkin', {
      MessageType: 'Authenticate',
      UDID: SIMULATED_UDID,
      SerialNumber: SIMULATED_SERIAL,
      BuildVersion: '20A362',
      OSVersion: '16.5',
      ProductName: 'iPhone14,2'
    });
    console.log('✓ [Simulador] ¡Autenticado! Dispositivo registrado en la plataforma.');
    await sleep(1500);

    // 2. Simular TokenUpdate (Enrolamiento Fase 2)
    console.log('\n2. [Simulador] Enviando TokenUpdate (Estableciendo canal push)...');
    await sendPlist('checkin', {
      MessageType: 'TokenUpdate',
      UDID: SIMULATED_UDID,
      PushMagic: 'magic_simulated_token_123',
      Token: Buffer.from('token_base64_sim').toString('base64'),
      UnlockToken: Buffer.from('unlock_base64_sim').toString('base64')
    });
    console.log('✓ [Simulador] ¡Tokens actualizados! Listo para recibir comandos.');
    console.log('----------------------------------------------------');
    console.log('💡 RECOMIENDA: Abre el panel de Vercel.');
    console.log('💡 Verás registrado un nuevo dispositivo: "APPLE iPhone (MDM)"');
    console.log('💡 Prueba a enviarle un comando de "Bloquear" o "Liberar".');
    console.log('----------------------------------------------------');
    console.log('📡 Escuchando comandos en bucle activo. Presiona Ctrl+C para salir.\n');

    // 3. Bucle activo de polling de comandos (simula recepción de push y descarga)
    let isLockedLocalState = false;

    while (true) {
      try {
        // Consultar el endpoint de comandos del servidor
        const response: any = await sendPlist('command', {
          UDID: SIMULATED_UDID
        });

        const requestType = response.RequestType || (response.Command && response.Command.RequestType);
        const commandUUID = response.CommandUUID;
        const message = response.Message || (response.Command && response.Command.Message);

        if (requestType && commandUUID) {
          console.log(`\n🔔 [MDM RECIBIDO] Comando: "${requestType}" (UUID: ${commandUUID})`);

          if (requestType === 'DeviceLock') {
            const displayMsg = message || 'Sin mensaje';
            isLockedLocalState = true;
            console.log(`🔒 [PANTALLA SIMULADA] ¡iPhone bloqueado digitalmente!`);
            console.log(`💬 Mensaje mostrado: "${displayMsg}"`);
            
            // Confirmar ejecución exitosa al servidor
            await sendPlist('command', {
              UDID: SIMULATED_UDID,
              Status: 'Acknowledged',
              CommandUUID: commandUUID
            });
            console.log(`✓ [Simulador] Confirmación de bloqueo enviada al servidor.`);

          } else if (requestType === 'ClearPasscode') {
            isLockedLocalState = false;
            console.log(`🔓 [PANTALLA SIMULADA] ¡iPhone liberado remotamente!`);
            
            // Confirmar ejecución exitosa al servidor
            await sendPlist('command', {
              UDID: SIMULATED_UDID,
              Status: 'Acknowledged',
              CommandUUID: commandUUID
            });
            console.log(`✓ [Simulador] Confirmación de liberación enviada al servidor.`);
          } else if (requestType === 'EraseDevice') {
            console.log(`💥 [PANTALLA SIMULADA] ¡Comando Borrar (Factory Reset) ejecutado!`);
            await sendPlist('command', {
              UDID: SIMULATED_UDID,
              Status: 'Acknowledged',
              CommandUUID: commandUUID
            });
            console.log(`✓ [Simulador] Confirmación de formateo enviada.`);
          } else {
            console.log(`ℹ️ [Simulador] Ejecutando otro comando de consulta: ${requestType}`);
            await sendPlist('command', {
              UDID: SIMULATED_UDID,
              Status: 'Acknowledged',
              CommandUUID: commandUUID
            });
          }
        }
      } catch (err: any) {
        console.error('Error en bucle de simulación:', err.message);
      }
      
      // Imprimir indicador visual de estado cada 5 segundos
      process.stdout.write(isLockedLocalState ? '🔴 [Bloqueado] ' : '🟢 [Activo] ');
      await sleep(4000);
    }

  } catch (error: any) {
    console.error('❌ Error en el simulador:', error.message);
    process.exit(1);
  }
}

startSimulation();
