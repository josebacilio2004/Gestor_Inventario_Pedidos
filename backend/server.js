const express = require('express');
const cors = require('cors');
require('dotenv').config();

const productosRoutes = require('./routes/productos');
const distribuidoresRoutes = require('./routes/distribuidores');
const pedidosRoutes = require('./routes/pedidos');
const inversionistasRoutes = require('./routes/inversionistas');
const compradoresRoutes = require('./routes/compradores');
const pagosCapitalRoutes = require('./routes/pagos-capital');
const pagosGananciaRoutes = require('./routes/pagos-ganancia');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://josebacilio2004.github.io'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rutas
app.use('/api/productos', productosRoutes);
app.use('/api/distribuidores', distribuidoresRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/inversionistas', inversionistasRoutes);
app.use('/api/compradores', compradoresRoutes);
app.use('/api/pagos-capital', pagosCapitalRoutes);
app.use('/api/pagos-ganancia', pagosGananciaRoutes);
app.use('/api/admin', adminRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'API de Gestión de Inventario, Pagos e Inversión',
        version: '2.0.0',
        endpoints: {
            productos: '/api/productos',
            distribuidores: '/api/distribuidores',
            pedidos: '/api/pedidos',
            inversionistas: '/api/inversionistas',
            compradores: '/api/compradores',
            pagosCapital: '/api/pagos-capital',
            estadisticas: '/api/pedidos/stats'
        }
    });
});

// Manejo de errores 404
app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📚 Documentación de API: http://localhost:${PORT}/`);
});
