-- ============================================
-- MIGRACIÓN: Rol Operador y Pedidos Herramientas
-- Ejecutar en: Neon SQL Editor
-- ============================================

-- Actualizar nombres de usuarios existentes
UPDATE compradores 
SET nombre = 'Alicia Peña Granilla' 
WHERE usuario = 'alicia';

UPDATE inversionistas 
SET nombre = 'Ssamira Xiomara Checya Peña' 
WHERE usuario = 'ssamira';

-- ============================================
-- TABLA OPERADORES
-- ============================================
CREATE TABLE IF NOT EXISTS operadores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar José como operador
INSERT INTO operadores (nombre, usuario, password_hash, email, activo)
VALUES ('José Anthony Bacilio De La Cruz', 'jose', 'jose123', 'jose@comercializadoraaly.com', true)
ON CONFLICT (usuario) DO UPDATE 
SET nombre = 'José Anthony Bacilio De La Cruz', password_hash = 'jose123', activo = true;

-- ============================================
-- TABLA PEDIDOS DE HERRAMIENTAS
-- ============================================
CREATE TABLE IF NOT EXISTS pedidos_herramientas (
    id SERIAL PRIMARY KEY,
    operador_id INTEGER REFERENCES operadores(id),
    comprador_id INTEGER REFERENCES compradores(id),
    estado VARCHAR(50) DEFAULT 'pendiente' 
        CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
    notas TEXT,
    total_mano_obra DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA ITEMS DE PEDIDO
-- ============================================
CREATE TABLE IF NOT EXISTS items_pedido_herramienta (
    id SERIAL PRIMARY KEY,
    pedido_id INTEGER NOT NULL REFERENCES pedidos_herramientas(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL,     -- 'Pico', 'Zapapico'
    marca VARCHAR(50) NOT NULL,    -- 'Tramontina', 'Bellota'
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    mano_obra DECIMAL(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRIGGER updated_at para pedidos_herramientas
-- ============================================
DROP TRIGGER IF EXISTS update_pedidos_herramientas_updated_at ON pedidos_herramientas;
CREATE TRIGGER update_pedidos_herramientas_updated_at
    BEFORE UPDATE ON pedidos_herramientas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICAR
-- ============================================
SELECT 'Operadores: ' || count(*) FROM operadores
UNION ALL
SELECT 'Tablas creadas exitosamente' as mensaje;
