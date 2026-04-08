const express = require('express');
const cors = require('cors');
require('dotenv').config();

console.log('🚀 Iniciando servidor backend...');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Configuración de CORS - AL PRINCIPIO ABSOLUTO
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://josebacilio2004.github.io'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Range', 'X-Content-Range']
}));

// Pre-flight OPTIONS handling
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - [${req.method}] ${req.path}`);
    next();
});

// Importación diferida de rutas para evitar colapsar si hay errores circulares
const productosRoutes = require('./routes/productos');
const distribuidoresRoutes = require('./routes/distribuidores');
const pedidosRoutes = require('./routes/pedidos');
const inversionistasRoutes = require('./routes/inversionistas');
const compradoresRoutes = require('./routes/compradores');
const pagosCapitalRoutes = require('./routes/pagos-capital');
const pagosGananciaRoutes = require('./routes/pagos-ganancia');
const adminRoutes = require('./routes/admin');
const operadoresRoutes = require('./routes/operadores');
const pedidosHerramientasRoutes = require('./routes/pedidos-herramientas');
const stockHerramientasRoutes = require('./routes/stock-herramientas');
const tandasRoutes = require('./routes/tandas');
const facturasCompradorRoutes = require('./routes/facturas-comprador');
const mayoristasRoutes = require('./routes/mayoristas');
const operadorPagosRoutes = require('./routes/operador-pagos');
const pedidoStockDetalleRoutes = require('./routes/pedido-stock-detalle');

// Rutas
app.use('/api/productos', productosRoutes);
app.use('/api/distribuidores', distribuidoresRoutes);
app.use('/api/pedidos', pedidoStockDetalleRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/inversionistas', inversionistasRoutes);
app.use('/api/compradores', compradoresRoutes);
app.use('/api/pagos-capital', pagosCapitalRoutes);
app.use('/api/pagos-ganancia', pagosGananciaRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/operadores', operadoresRoutes);
app.use('/api/pedidos-herramientas', pedidosHerramientasRoutes);
app.use('/api/stock-herramientas', stockHerramientasRoutes);
app.use('/api/tandas', tandasRoutes);
app.use('/api/facturas-comprador', facturasCompradorRoutes);
app.use('/api/mayoristas', mayoristasRoutes);
app.use('/api/operador-pagos', operadorPagosRoutes);

// Ruta raíz (Salud)
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        message: 'API de Gestión de Inventario, Pagos e Inversión',
        timestamp: new Date().toISOString()
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('❌ ERROR GLOBAL:', err);
    
    // Asegurar que las respuestas de error también tengan CORS (redundancia)
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    
    res.status(err.status || 500).json({
        error: 'Error interno del servidor',
        message: err.message,
        path: req.path
    });
});

// Captura de errores que matan el proceso
process.on('uncaughtException', (err) => {
  console.error('🔥 CRASH: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 CRASH: Unhandled Rejection at:', promise, 'reason:', reason);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🌍 URL permitida por CORS: https://josebacilio2004.github.io`);
});
