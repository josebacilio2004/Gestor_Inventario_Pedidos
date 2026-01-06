-- Sistema de Gestión de Inventario, Pagos e Inversión - Ferretería
-- Actualizado con tracking de inversionistas y devolución progresiva de capital
-- Base de datos PostgreSQL

-- Eliminar tablas si existen (para desarrollo)
DROP TABLE IF EXISTS pagos_capital CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS distribuidores CASCADE;
DROP TABLE IF EXISTS inversionistas CASCADE;
DROP TABLE IF EXISTS compradores CASCADE;

-- Tabla de Productos
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo_producto VARCHAR(100) NOT NULL,
    precio_referencia DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Distribuidores (Proveedores)
CREATE TABLE distribuidores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Inversionistas (Quienes proveen el capital)
CREATE TABLE inversionistas (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Compradores Principales (Quienes gestionan las compras)
CREATE TABLE compradores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    contacto VARCHAR(255),
    telefono VARCHAR(50),
    email VARCHAR(255),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Pedidos (con tracking de inversión)
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    fecha_pedido DATE NOT NULL,
    
    -- Relaciones
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    distribuidor_id INTEGER NOT NULL REFERENCES distribuidores(id) ON DELETE RESTRICT,
    inversionista_id INTEGER REFERENCES inversionistas(id) ON DELETE RESTRICT,
    comprador_id INTEGER REFERENCES compradores(id) ON DELETE RESTRICT,
    
    -- Datos del pedido
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    
    -- Capital e Inversión
    capital_invertido DECIMAL(10, 2) NOT NULL CHECK (capital_invertido >= 0),
    capital_devuelto DECIMAL(10, 2) DEFAULT 0 CHECK (capital_devuelto >= 0),
    capital_pendiente DECIMAL(10, 2) GENERATED ALWAYS AS (capital_invertido - capital_devuelto) STORED,
    
    -- Ganancias
    ganancia_esperada DECIMAL(10, 2) NOT NULL CHECK (ganancia_esperada >= 0),
    ganancia_real DECIMAL(10, 2) DEFAULT 0 CHECK (ganancia_real >= 0),
    ganancia_devuelta BOOLEAN DEFAULT FALSE,
    fecha_ganancia_devuelta TIMESTAMP,
    
    -- Devolución total (capital + ganancia)
    devolucion_capital DECIMAL(10, 2) DEFAULT 0 CHECK (devolucion_capital >= 0),
    
    -- Estado
    estado VARCHAR(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
    notas TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CHECK (capital_devuelto <= capital_invertido)
);

-- Tabla de Pagos de Capital (Devolución Progresiva)
CREATE TABLE pagos_capital (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),
    fecha_pago DATE NOT NULL,
    tipo_pago VARCHAR(50) DEFAULT 'capital' CHECK (tipo_pago IN ('capital', 'ganancia', 'mixto')),
    metodo_pago VARCHAR(100),
    comprobante VARCHAR(255),
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX idx_pedidos_producto ON pedidos(producto_id);
CREATE INDEX idx_pedidos_distribuidor ON pedidos(distribuidor_id);
CREATE INDEX idx_pedidos_inversionista ON pedidos(inversionista_id);
CREATE INDEX idx_pedidos_comprador ON pedidos(comprador_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pagos_pedido ON pagos_capital(pedido_id);
CREATE INDEX idx_pagos_fecha ON pagos_capital(fecha_pago);

-- Datos de ejemplo para pruebas

-- Productos
INSERT INTO productos (nombre, descripcion, tipo_producto, precio_referencia) VALUES
('Cemento Portland', 'Cemento gris tipo I', 'Material de construcción', 8.50),
('Tornillos 1/4"', 'Tornillos para madera', 'Ferretería', 0.15),
('Pintura Látex Blanca', 'Pintura látex interior/exterior', 'Pinturas', 25.00),
('Cable eléctrico 12 AWG', 'Cable de cobre para instalaciones', 'Eléctricos', 1.50),
('Tubería PVC 1/2"', 'Tubería PVC presión', 'Plomería', 3.20);

-- Distribuidores
INSERT INTO distribuidores (nombre, contacto, telefono, email, direccion) VALUES
('Distribuidora Central', 'Juan Pérez', '555-0101', 'ventas@central.com', 'Av. Principal 123'),
('Ferretería Mayorista S.A.', 'María González', '555-0202', 'info@mayorista.com', 'Calle Comercio 456'),
('Importadora del Norte', 'Carlos Ramírez', '555-0303', 'contacto@norte.com', 'Zona Industrial 789');

-- Inversionistas
INSERT INTO inversionistas (nombre, contacto, telefono, email, notas) VALUES
('Inversiones García SAC', 'Roberto García', '999-111-222', 'r.garcia@inversiones.com', 'Inversionista principal'),
('Familia Rodríguez', 'Ana Rodríguez', '999-333-444', 'ana.r@email.com', 'Inversión familiar'),
('Fondo Capital Plus', 'Jorge Lima', '999-555-666', 'contacto@capitalplus.com', 'Fondo de inversión');

-- Compradores Principales
INSERT INTO compradores (nombre, contacto, telefono, email, notas) VALUES
('Pedro Sánchez', 'Pedro Sánchez', '988-111-222', 'p.sanchez@email.com', 'Comprador principal - Zona Norte'),
('Luis Mendoza', 'Luis Mendoza', '988-333-444', 'l.mendoza@email.com', 'Comprador principal - Zona Centro'),
('Carmen Vega', 'Carmen Vega', '988-555-666', 'c.vega@email.com', 'Comprador principal - Zona Sur');

-- Triggers para actualizar updated_at y capital_devuelto automáticamente

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar capital_devuelto cuando se registra un pago
CREATE OR REPLACE FUNCTION update_capital_devuelto()
RETURNS TRIGGER AS $$
BEGIN
    -- Actualizar el capital devuelto en la tabla pedidos
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
$$ language 'plpgsql';

CREATE TRIGGER update_capital_after_pago AFTER INSERT OR UPDATE OR DELETE ON pagos_capital
FOR EACH ROW EXECUTE FUNCTION update_capital_devuelto();

-- Vista para resumen de inversionistas
CREATE OR REPLACE VIEW vista_inversionistas_resumen AS
SELECT 
    i.id,
    i.nombre,
    i.contacto,
    i.telefono,
    COUNT(p.id) as total_pedidos,
    COALESCE(SUM(p.capital_invertido), 0) as capital_total_invertido,
    COALESCE(SUM(p.capital_devuelto), 0) as capital_total_devuelto,
    COALESCE(SUM(p.capital_pendiente), 0) as capital_total_pendiente,
    COALESCE(SUM(p.ganancia_real), 0) as ganancia_total_real,
    COALESCE(SUM(CASE WHEN p.ganancia_devuelta THEN p.ganancia_real ELSE 0 END), 0) as ganancia_devuelta,
    COALESCE(SUM(CASE WHEN NOT p.ganancia_devuelta THEN p.ganancia_real ELSE 0 END), 0) as ganancia_pendiente
FROM inversionistas i
LEFT JOIN pedidos p ON i.id = p.inversionista_id
GROUP BY i.id, i.nombre, i.contacto, i.telefono;

-- Vista para resumen de compradores
CREATE OR REPLACE VIEW vista_compradores_resumen AS
SELECT 
    c.id,
    c.nombre,
    c.contacto,
    c.telefono,
    COUNT(p.id) as total_pedidos,
    COALESCE(SUM(p.capital_invertido), 0) as capital_total_gestionado,
    COALESCE(SUM(p.capital_devuelto), 0) as capital_devuelto,
    COALESCE(SUM(p.capital_pendiente), 0) as capital_pendiente_devolver,
    COALESCE(SUM(p.ganancia_real), 0) as ganancia_generada
FROM compradores c
LEFT JOIN pedidos p ON c.id = p.comprador_id
GROUP BY c.id, c.nombre, c.contacto, c.telefono;
