// ============================================================
// OPERADOR CONFIG - usa window.API_URL definido en config.js
// ============================================================

// Tarifas de mano de obra (sincronizadas con backend)
const TARIFAS_MANO_OBRA = {
    'Pico-Tramontina': { base: 1, tarifa: 0.43 },
    'Pico-Bellota': { base: 1, tarifa: 0.55 },
    'Zapapico-Tramontina': { base: 1, tarifa: 0.43 },
    'Zapapico-Bellota': { base: 1, tarifa: 0.55 },
};

function calcularManoObra(tipo, marca, cantidad) {
    const key = `${tipo}-${marca}`;
    const cfg = TARIFAS_MANO_OBRA[key];
    if (!cfg || !cantidad || cantidad <= 0) return 0;
    return parseFloat(((cantidad / cfg.base) * cfg.tarifa).toFixed(2));
}

function formatCurrency(amount) {
    return `S/ ${parseFloat(amount || 0).toFixed(2)}`;
}

// fetchAPI: usa window.API_URL + /api + endpoint
async function fetchAPI(endpoint, options = {}) {
    const base = (window.API_URL || '').replace(/\/$/, '');
    const url = `${base}/api${endpoint}`;
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
    }
    return res.json();
}
