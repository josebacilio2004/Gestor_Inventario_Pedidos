-- Schema limpio para Render PostgreSQL (sin privilegios de superusuario)
-- Compatible con DBeaver

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

-- ============================================
-- FUNCIONES
-- ============================================

CREATE OR REPLACE FUNCTION update_capital_devuelto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE pedidos 
    SET capital_devuelto = (
        SELECT COALESCE(SUM(monto), 0) 
        FROM pagos_capital 
        WHERE pedido_id = NEW.pedido_id 
        AND tipo_pago IN ('capital', 'mixto')
    )
    WHERE id = NEW.pedido_id;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- ============================================
-- TABLAS PRINCIPALES
-- ============================================

-- Usuarios Admin
CREATE TABLE IF NOT EXISTS usuarios_admin (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inversionistas
CREATE TABLE IF NOT EXISTS inversionistas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    notas TEXT,
    usuario VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compradores
CREATE TABLE IF NOT EXISTS compradores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    notas TEXT,
    usuario VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distribuidores
CREATE TABLE IF NOT EXISTS distribuidores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Productos
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2),
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    tipo_producto VARCHAR(100),
    precio_referencia DECIMAL(10,2),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    fecha_pedido DATE NOT NULL,
    producto_id INTEGER NOT NULL,
    distribuidor_id INTEGER NOT NULL,
    inversionista_id INTEGER,
    comprador_id INTEGER,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    capital_invertido DECIMAL(10,2) NOT NULL CHECK (capital_invertido >= 0),
    capital_devuelto DECIMAL(10,2) DEFAULT 0 CHECK (capital_devuelto >= 0),
    capital_pendiente DECIMAL(10,2) GENERATED ALWAYS AS (capital_invertido - capital_devuelto) STORED,
    ganancia_esperada DECIMAL(10,2) NOT NULL CHECK (ganancia_esperada >= 0),
    ganancia_real DECIMAL(10,2) DEFAULT 0 CHECK (ganancia_real >= 0),
    ganancia_devuelta BOOLEAN DEFAULT false,
    ganancia_devuelta_monto DECIMAL(10,2) DEFAULT 0,
    ganancia_pendiente DECIMAL(10,2),
    fecha_ganancia_devuelta TIMESTAMP,
    devolucion_capital DECIMAL(10,2) DEFAULT 0 CHECK (devolucion_capital >= 0),
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pedidos_check CHECK (capital_devuelto <= capital_invertido)
);

-- Pagos de Capital
CREATE TABLE IF NOT EXISTS pagos_capital (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    fecha_pago DATE NOT NULL,
    tipo_pago VARCHAR(50) DEFAULT 'capital' CHECK (tipo_pago IN ('capital', 'ganancia', 'mixto')),
    metodo_pago VARCHAR(100),
    comprobante VARCHAR(255),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pagos de Ganancia
CREATE TABLE IF NOT EXISTS pagos_ganancia (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER,
    monto DECIMAL(10,2) NOT NULL CHECK (monto > 0),
    fecha_pago DATE NOT NULL,
    tipo_pago VARCHAR(50) DEFAULT 'Ganancia',
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- FOREIGN KEYS
-- ============================================

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_producto_id_fkey;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_producto_id_fkey 
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT;

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_distribuidor_id_fkey;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_distribuidor_id_fkey 
    FOREIGN KEY (distribuidor_id) REFERENCES distribuidores(id) ON DELETE RESTRICT;

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_inversionista_id_fkey;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_inversionista_id_fkey 
    FOREIGN KEY (inversionista_id) REFERENCES inversionistas(id) ON DELETE RESTRICT;

ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_comprador_id_fkey;
ALTER TABLE pedidos ADD CONSTRAINT pedidos_comprador_id_fkey 
    FOREIGN KEY (comprador_id) REFERENCES compradores(id) ON DELETE RESTRICT;

ALTER TABLE pagos_capital DROP CONSTRAINT IF EXISTS pagos_capital_pedido_id_fkey;
ALTER TABLE pagos_capital ADD CONSTRAINT pagos_capital_pedido_id_fkey 
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE;

ALTER TABLE pagos_ganancia DROP CONSTRAINT IF EXISTS pagos_ganancia_pedido_id_fkey;
ALTER TABLE pagos_ganancia ADD CONSTRAINT pagos_ganancia_pedido_id_fkey 
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE;

-- ============================================
-- INDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_producto ON pedidos(producto_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_distribuidor ON pedidos(distribuidor_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_inversionista ON pedidos(inversionista_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_comprador ON pedidos(comprador_id);
CREATE INDEX IF NOT EXISTS idx_pagos_pedido ON pagos_capital(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos_capital(fecha_pago);

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_capital_after_pago ON pagos_capital;
CREATE TRIGGER update_capital_after_pago 
    AFTER INSERT OR DELETE OR UPDATE ON pagos_capital 
    FOR EACH ROW EXECUTE FUNCTION update_capital_devuelto();

DROP TRIGGER IF EXISTS update_pedidos_updated_at ON pedidos;
CREATE TRIGGER update_pedidos_updated_at 
    BEFORE UPDATE ON pedidos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VISTAS
-- ============================================

CREATE OR REPLACE VIEW vista_inversionistas_resumen AS
SELECT 
    i.id,
    i.nombre,
    i.contacto,
    i.telefono,
    COUNT(p.id) AS total_pedidos,
    COALESCE(SUM(p.capital_invertido), 0) AS capital_total_invertido,
    COALESCE(SUM(p.capital_devuelto), 0) AS capital_total_devuelto,
    COALESCE(SUM(p.capital_pendiente), 0) AS capital_total_pendiente,
    COALESCE(SUM(p.ganancia_real), 0) AS ganancia_total_real,
    COALESCE(SUM(CASE WHEN p.ganancia_devuelta THEN p.ganancia_real ELSE 0 END), 0) AS ganancia_devuelta,
    COALESCE(SUM(CASE WHEN NOT p.ganancia_devuelta THEN p.ganancia_real ELSE 0 END), 0) AS ganancia_pendiente
FROM inversionistas i
LEFT JOIN pedidos p ON i.id = p.inversionista_id
GROUP BY i.id, i.nombre, i.contacto, i.telefono;

CREATE OR REPLACE VIEW vista_compradores_resumen AS
SELECT 
    c.id,
    c.nombre,
    c.contacto,
    c.telefono,
    COUNT(p.id) AS total_pedidos,
    COALESCE(SUM(p.capital_invertido), 0) AS capital_total_gestionado,
    COALESCE(SUM(p.capital_devuelto), 0) AS capital_devuelto,
    COALESCE(SUM(p.capital_pendiente), 0) AS capital_pendiente_devolver,
    COALESCE(SUM(p.ganancia_real), 0) AS ganancia_generada
FROM compradores c
LEFT JOIN pedidos p ON c.id = p.comprador_id
GROUP BY c.id, c.nombre, c.contacto, c.telefono;

-- ============================================
-- FINALIZADO
-- ============================================

SELECT 'Schema creado exitosamente' as mensaje;
