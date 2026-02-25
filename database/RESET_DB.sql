-- ==========================================================
-- SCRIPT PARA REINICIAR (LIMPIAR) LA BASE DE DATOS
-- ==========================================================
-- ADVERTENCIA: ESTO BORRARÁ TODOS LOS REGISTROS (DATOS)
-- PERO MANTENDRÁ LA ESTRUCTURA DE LAS TABLAS.
-- ==========================================================

-- Este comando TRUNCATE con CASCADE vacía todas las tablas 
-- y reinicia los contadores (IDs) a 1 (RESTART IDENTITY).
-- Cascade se encarga de borrar también los registros que
-- dependen de estas tablas (como pagos de pedidos, etc).

TRUNCATE TABLE 
    usuarios_admin, 
    inversionistas, 
    compradores, 
    distribuidores, 
    productos, 
    pedidos, 
    pagos_capital, 
    pagos_ganancia, 
    facturas_comprador, 
    abonos_factura, 
    tandas, 
    aportes_tanda, 
    pagos_tanda, 
    pedidos_herramientas, 
    inventario_herramientas,
    operadores,
    actividades_operador
RESTART IDENTITY CASCADE;

-- Insertamos al Administrador por defecto nuevamente (si se borró)
INSERT INTO usuarios_admin (nombre, usuario, password_hash, email) 
VALUES (
    'Administrador', 
    'admin', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 'admin123'
    'admin@comercializadoraaly.com'
) ON CONFLICT (usuario) DO NOTHING;

SELECT 'Base de datos reiniciada exitosamente' as resultado;
