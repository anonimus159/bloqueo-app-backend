-- Esquema SQL para el Sistema de Control de Dispositivos Financiados
-- Motor: PostgreSQL

-- Crear extensiones útiles si no existen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Definición de ENUMs para consistencia de estados
CREATE TYPE device_status_enum AS ENUM ('active', 'suspended', 'locked');
CREATE TYPE command_type_enum AS ENUM ('lock', 'unlock', 'wipe');
CREATE TYPE command_status_enum AS ENUM ('pending', 'sent', 'executed', 'failed');

-- 1. Tabla de Administradores del Panel Web
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- 'superadmin', 'admin', 'operator'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Dispositivos Registrados (Celulares Financiados)
CREATE TABLE IF NOT EXISTS devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    imei VARCHAR(15) UNIQUE,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    status device_status_enum DEFAULT 'active',
    customer_name VARCHAR(150),
    customer_phone VARCHAR(20),
    device_token VARCHAR(255), -- Token único generado para autenticar al dispositivo cliente
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Comandos Enviados a los Dispositivos
CREATE TABLE IF NOT EXISTS commands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE CASCADE,
    type command_type_enum NOT NULL,
    status command_status_enum DEFAULT 'pending',
    signature TEXT, -- Firma digital del comando con clave privada (ECDSA P-256)
    token VARCHAR(255) UNIQUE NOT NULL, -- Token de un solo uso (nonce) asociado a este comando
    payload JSONB, -- Parámetros extra si son necesarios (ej. mensaje en pantalla)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP WITH TIME ZONE
);

-- Indexar consultas frecuentes
CREATE INDEX idx_devices_serial_number ON devices(serial_number);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_commands_device_status ON commands(device_id, status);

-- Trigger para actualizar el campo updated_at de manera automática
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 4. Tabla de Pagos Recibidos (Webhooks de Terceros)
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    gateway VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_device ON payments(device_id);
