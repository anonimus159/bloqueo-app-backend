import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, SafeAreaView, StatusBar } from 'react-native';

// Si probamos en el Emulador de Android Studio, 10.0.2.2 apunta al localhost de la PC.
const BACKEND_URL = 'http://10.0.2.2:3000/api/v1/devices';
// Hardcodeamos el serial para esta prueba. En producción esto se saca del hardware nativo.
const DEVICE_SERIAL = 'REF-SAMSUNG-S24-001';

export default function App() {
  const [deviceStatus, setDeviceStatus] = useState('active');
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    // Polling cada 3 segundos para consultar el estado al backend
    const interval = setInterval(async () => {
      try {
        const response = await fetch(BACKEND_URL, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        
        if (response.ok) {
          setConnectionError(false);
          const data = await response.json();
          // El backend devuelve { devices: [...] }
          // Ah, espera! El backend web espera un arreglo directo o un objeto?
          // En deviceController, `res.json(devices)` devuelve un array directo.
          const me = data.find(d => d.serial_number === DEVICE_SERIAL);
          if (me) {
            setDeviceStatus(me.status);
          }
        } else {
          setConnectionError(true);
        }
      } catch (error) {
        setConnectionError(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (deviceStatus === 'locked') {
    return (
      <View style={styles.lockedContainer}>
        <StatusBar hidden={true} />
        <View style={styles.lockBox}>
          <Text style={styles.lockedTitle}>DISPOSITIVO BLOQUEADO</Text>
          <Text style={styles.lockedText}>Este equipo ha sido bloqueado por falta de pago o por reporte de robo/pérdida.</Text>
          <Text style={styles.lockedSubtext}>Por favor, contacte a su proveedor financiero para regularizar su situación y reactivar el terminal.</Text>
          <Text style={styles.serialText}>Serial: {DEVICE_SERIAL}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.activeContainer}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Dispositivo</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estado de la Licencia</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>ACTIVO</Text>
        </View>
        <Text style={styles.infoText}>Su dispositivo está funcionando correctamente y está sincronizado con el servidor.</Text>
        
        {connectionError && (
          <Text style={styles.errorText}>No se pudo conectar con el servidor.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- Estilos para Estado Activo ---
  activeContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  card: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 15,
  },
  statusBadge: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  infoText: {
    textAlign: 'center',
    color: '#374151',
    lineHeight: 22,
  },
  errorText: {
    marginTop: 20,
    color: '#EF4444',
    fontSize: 12,
    textAlign: 'center',
  },

  // --- Estilos para Estado Bloqueado ---
  lockedContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  lockBox: {
    backgroundColor: '#1F2937',
    padding: 30,
    margin: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#EF4444',
    alignItems: 'center',
    width: '90%',
  },
  lockedTitle: {
    color: '#EF4444',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 20,
    textAlign: 'center',
  },
  lockedText: {
    color: '#F9FAFB',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  lockedSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  serialText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'monospace',
  }
});
