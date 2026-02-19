// Configuración API
const API_CONFIG = {
    // Detectar entorno automáticamente
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3002/api'
        : 'https://gestor-inventario-backend.onrender.com/api'
};

// Tarifas de mano de obra (mismas que backend)
const TARIFAS_MANO_OBRA = {
    'Pico-Tramontina': { base: 120, tarifa: 50, label: 'Pico Tramontina' },
    'Pico-Bellota': { base: 120, tarifa: 60, label: 'Pico Bellota' },
    'Zapapico-Tramontina': { base: 120, tarifa: 50, label: 'Zapapico Tramontina' },
    'Zapapico-Bellota': { base: 120, tarifa: 60, label: 'Zapapico Bellota' },
};

function calcularManoObra(tipo, marca, cantidad) {
    const key = `${tipo}-${marca}`;
    const config = TARIFAS_MANO_OBRA[key];
    if (!config || !cantidad) return 0;
    return parseFloat(((cantidad / config.base) * config.tarifa).toFixed(2));
}

function formatCurrency(amount) {
    return `S/ ${parseFloat(amount || 0).toFixed(2)}`;
}

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Error ${response.status}`);
    }
    return response.json();
}
