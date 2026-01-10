// Configuración de API según entorno
const API_CONFIG = {
    development: 'http://localhost:3002',
    production: 'https://gestor-inventario-pedidos.onrender.com'
};

// Detectar entorno automáticamente
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? API_CONFIG.development
    : API_CONFIG.production;

// Exportar para uso global
window.API_URL = API_URL;

// Log para depuración
console.log('🌍 Entorno detectado:', window.location.hostname === 'localhost' ? 'DESARROLLO' : 'PRODUCCIÓN');
console.log('🔗 API URL configurada:', API_URL);
