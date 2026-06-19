-- ==============================================================================
-- CodeCraft Device Controller - Database Schema
-- Ejecutar en Supabase -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Crear tabla de dispositivos
CREATE TABLE IF NOT EXISTS devices (
    id SERIAL PRIMARY KEY,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    imei VARCHAR(50),
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'locked', 'suspended', 'wiped')),
    customer_name VARCHAR(150),
    customer_phone VARCHAR(50),
    device_token TEXT NOT NULL, -- Token JWT de autenticación de hardware
    last_sync_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear tabla de historial y encolamiento de comandos
CREATE TABLE IF NOT EXISTS commands (
    id SERIAL PRIMARY KEY,
    device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('lock', 'unlock', 'wipe')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'executed', 'failed')),
    signature TEXT NOT NULL, -- Firma criptográfica asimétrica simulada
    token VARCHAR(100) NOT NULL, -- Nonce / token único anti-replay
    payload JSONB DEFAULT '{}', -- Datos adjuntos (ej. el mensaje de cobro)
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Índices de optimización de búsqueda
CREATE INDEX idx_devices_serial ON devices(serial_number);
CREATE INDEX idx_commands_device_status ON commands(device_id, status);

-- (Opcional) Insertar el dispositivo de demostración inicial
INSERT INTO devices (serial_number, imei, brand, model, customer_name, customer_phone, device_token, status)
VALUES (
    'REF-SAMSUNG-S24-001',
    '358901234567890',
    'Samsung',
    'Galaxy S24 Ultra',
    'Usuario de Prueba',
    '+57 300 000 0000',
    'token_seguro_mock_para_demostracion',
    'active'
) ON CONFLICT (serial_number) DO NOTHING;

-- 4. Crear tabla de administradores
CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
