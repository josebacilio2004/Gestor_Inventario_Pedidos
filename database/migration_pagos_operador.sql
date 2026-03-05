-- ==============================================================================
-- MIGRACIÓN: Módulo de Pagos Progresivos al Operador
-- Ejecutar en Neon SQL Editor
-- ==============================================================================

CREATE TABLE IF NOT EXISTS pagos_operadores (
    id SERIAL PRIMARY KEY,
    operador_id INT NOT NULL REFERENCES operadores(id),
    tanda_id INT NOT NULL REFERENCES tandas(id) ON DELETE CASCADE,
    monto NUMERIC(10,2) NOT NULL CHECK(monto > 0),
    fecha TIMESTAMPTZ DEFAULT NOW(),
    metodo_pago VARCHAR(100),
    notas TEXT
);

-- Índice para mejorar el rendimiento de consultas por tanda y operador
CREATE INDEX IF NOT EXISTS idx_pagos_operadores_tanda ON pagos_operadores(tanda_id);
CREATE INDEX IF NOT EXISTS idx_pagos_operadores_operador ON pagos_operadores(operador_id);

-- Para verificar
SELECT 'pagos_operadores' AS tabla, COUNT(*) FROM pagos_operadores;
