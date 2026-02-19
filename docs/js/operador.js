// ============================================
// OPERADOR DASHBOARD - JAVASCRIPT
// ============================================

let operadorSesion = null;
let itemsPedido = [];
let compradores = [];

// ============================================
// INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    verificarSesion();
    cargarCompradores();
    cargarPedidos();
    document.getElementById('form-nuevo-pedido').addEventListener('submit', guardarPedido);
});

function verificarSesion() {
    const sesion = localStorage.getItem('operador_sesion');
    if (!sesion) {
        window.location.href = '../login.html';
        return;
    }
    operadorSesion = JSON.parse(sesion);
    document.getElementById('operador-nombre').textContent = operadorSesion.nombre.split(' ')[0];
    document.getElementById('operador-nombre-nav').textContent = operadorSesion.nombre;
}

function logout() {
    localStorage.removeItem('operador_sesion');
    window.location.href = '../login.html';
}

// ============================================
// CARGAR COMPRADORES
// ============================================
async function cargarCompradores() {
    try {
        compradores = await fetchAPI('/compradores');
        const select = document.getElementById('select-comprador');
        compradores.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.nombre;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error('Error al cargar compradores:', err);
    }
}

// ============================================
// CALCULADORA MANO DE OBRA (tiempo real)
// ============================================
function actualizarPreviewMO() {
    const tipo = document.getElementById('tipo-herramienta').value;
    const marca = document.getElementById('marca-herramienta').value;
    const cantidad = parseInt(document.getElementById('cantidad-herramienta').value) || 0;

    const mo = calcularManoObra(tipo, marca, cantidad);
    const key = `${tipo}-${marca}`;
    const tarifa = TARIFAS_MANO_OBRA[key];

    document.getElementById('mo-amount-preview').textContent = formatCurrency(mo);

    if (tarifa && cantidad > 0) {
        document.getElementById('mo-calc-preview').textContent =
            `${cantidad} ud × S/${tarifa.tarifa}/${tarifa.base}`;
    } else {
        document.getElementById('mo-calc-preview').textContent = '';
    }
}

// ============================================
// AGREGAR ITEM AL PEDIDO
// ============================================
function agregarItem() {
    const tipo = document.getElementById('tipo-herramienta').value;
    const marca = document.getElementById('marca-herramienta').value;
    const cantidadInput = document.getElementById('cantidad-herramienta');
    const cantidad = parseInt(cantidadInput.value);

    if (!cantidad || cantidad <= 0) {
        showToast('Ingresa una cantidad válida', 'error');
        cantidadInput.focus();
        return;
    }

    const manoObra = calcularManoObra(tipo, marca, cantidad);
    const id = Date.now(); // ID temporal para el frontend

    const item = { id, tipo, marca, cantidad, mano_obra: manoObra };
    itemsPedido.push(item);

    renderItems();
    updateResumen();

    // Limpiar cantidad
    cantidadInput.value = '';
    document.getElementById('mo-amount-preview').textContent = 'S/ 0.00';
    document.getElementById('mo-calc-preview').textContent = '';
    cantidadInput.focus();
}

// ============================================
// ELIMINAR ITEM
// ============================================
function eliminarItem(id) {
    itemsPedido = itemsPedido.filter(item => item.id !== id);
    renderItems();
    updateResumen();
}

// ============================================
// RENDER ITEMS EN LISTA
// ============================================
function renderItems() {
    const container = document.getElementById('items-list');
    const emptyMsg = document.getElementById('items-empty');

    if (itemsPedido.length === 0) {
        container.innerHTML = `
            <div class="items-empty" id="items-empty">
                <span>📦</span>
                <p>Agrega herramientas al pedido usando el formulario de arriba</p>
            </div>`;
        return;
    }

    const iconos = { 'Pico': '⛏️', 'Zapapico': '🪓' };

    container.innerHTML = itemsPedido.map(item => `
        <div class="item-row" id="item-${item.id}">
            <span class="item-icon">${iconos[item.tipo] || '🔧'}</span>
            <div class="item-info">
                <div class="item-nombre">${item.tipo} ${item.marca}</div>
                <div class="item-detalle">
                    ${item.cantidad} unidades
                    <span style="color:var(--text-light);">•</span>
                    S/${TARIFAS_MANO_OBRA[`${item.tipo}-${item.marca}`]?.tarifa || 0} por 120 ud
                </div>
            </div>
            <div class="item-mo">
                <div class="item-mo-amount">${formatCurrency(item.mano_obra)}</div>
                <div class="item-mo-label">Mano de Obra</div>
            </div>
            <button class="item-delete" onclick="eliminarItem(${item.id})" title="Eliminar item">🗑️</button>
        </div>
    `).join('');
}

// ============================================
// ACTUALIZAR RESUMEN TOTAL
// ============================================
function updateResumen() {
    const resumen = document.getElementById('pedido-resumen');
    const totalItems = itemsPedido.reduce((s, i) => s + i.cantidad, 0);
    const totalMO = itemsPedido.reduce((s, i) => s + i.mano_obra, 0);

    if (itemsPedido.length > 0) {
        resumen.style.display = 'block';
        document.getElementById('resumen-items').textContent = `${itemsPedido.length} tipo(s), ${totalItems} ud`;
        document.getElementById('resumen-mano-obra').textContent = formatCurrency(totalMO);
    } else {
        resumen.style.display = 'none';
    }
}

// ============================================
// GUARDAR PEDIDO
// ============================================
async function guardarPedido(e) {
    e.preventDefault();

    const compradorId = document.getElementById('select-comprador').value;
    if (!compradorId) {
        showToast('Selecciona un comprador', 'error');
        return;
    }
    if (itemsPedido.length === 0) {
        showToast('Agrega al menos una herramienta al pedido', 'error');
        return;
    }

    const btn = document.getElementById('btn-guardar-pedido');
    btn.disabled = true;
    btn.textContent = '⏳ Guardando...';

    try {
        const payload = {
            operador_id: operadorSesion.id,
            comprador_id: parseInt(compradorId),
            notas: document.getElementById('notas-pedido').value,
            items: itemsPedido.map(({ tipo, marca, cantidad }) => ({ tipo, marca, cantidad }))
        };

        await fetchAPI('/pedidos-herramientas', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        showToast('✅ Pedido guardado exitosamente!', 'success');
        limpiarFormulario();
        cargarPedidos();

    } catch (err) {
        showToast(`❌ Error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 Guardar Pedido';
    }
}

// ============================================
// LIMPIAR FORMULARIO
// ============================================
function limpiarFormulario() {
    itemsPedido = [];
    renderItems();
    updateResumen();
    document.getElementById('notas-pedido').value = '';
    document.getElementById('select-comprador').value = '';
    document.getElementById('cantidad-herramienta').value = '';
    document.getElementById('mo-amount-preview').textContent = 'S/ 0.00';
    document.getElementById('mo-calc-preview').textContent = '';
}

// ============================================
// CARGAR PEDIDOS
// ============================================
async function cargarPedidos() {
    const container = document.getElementById('pedidos-container');
    const estado = document.getElementById('filtro-estado').value;

    container.innerHTML = `
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>
    `;

    try {
        let url = `/pedidos-herramientas?operador_id=${operadorSesion?.id || ''}`;
        if (estado) url += `&estado=${estado}`;

        const pedidos = await fetchAPI(url);
        actualizarStats(pedidos);
        renderPedidos(pedidos);
    } catch (err) {
        container.innerHTML = `<p class="text-center text-secondary">Error al cargar pedidos: ${err.message}</p>`;
    }
}

// Actualizar contadores del header
function actualizarStats(pedidos) {
    document.getElementById('count-pendiente').textContent =
        pedidos.filter(p => p.estado === 'pendiente').length;
    document.getElementById('count-proceso').textContent =
        pedidos.filter(p => p.estado === 'en_proceso').length;
    document.getElementById('count-completado').textContent =
        pedidos.filter(p => p.estado === 'completado').length;
}

// ============================================
// RENDER LISTA DE PEDIDOS
// ============================================
function renderPedidos(pedidos) {
    const container = document.getElementById('pedidos-container');

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="items-empty" style="padding:3rem;">
                <span>📋</span>
                <p>No hay pedidos registrados aún</p>
                <a href="#nuevo-pedido" class="btn btn-primary" style="margin-top:1rem;">
                    ➕ Crear primer pedido
                </a>
            </div>`;
        return;
    }

    const iconos = { 'Pico': '⛏️', 'Zapapico': '🪓' };

    container.innerHTML = pedidos.map(pedido => {
        const items = pedido.items || [];
        const itemTags = items.map(i =>
            `<span class="item-tag">${iconos[i.tipo] || '🔧'} ${i.tipo} ${i.marca} × ${i.cantidad}</span>`
        ).join('');

        const fecha = new Date(pedido.created_at).toLocaleDateString('es-PE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        return `
        <div class="pedido-card">
            <div class="pedido-card-header">
                <div>
                    <div class="pedido-card-id">#${String(pedido.id).padStart(4, '0')} · ${fecha}</div>
                    <div class="pedido-card-comprador">👤 ${pedido.comprador_nombre || 'Sin comprador'}</div>
                </div>
                <span class="badge-estado badge-${pedido.estado}">${estadoLabel(pedido.estado)}</span>
            </div>
            <div class="pedido-card-body">
                <div class="pedido-items-preview">
                    ${itemTags || '<span class="item-tag" style="color:var(--text-secondary);">Sin items</span>'}
                </div>
                ${pedido.notas ? `<p style="font-size:0.85rem; color:var(--text-secondary); margin:0;">📝 ${pedido.notas}</p>` : ''}
            </div>
            <div class="pedido-card-footer">
                <div class="pedido-mano-obra">🔧 M.O: ${formatCurrency(pedido.total_mano_obra)}</div>
                <div class="pedido-actions">
                    <select class="select-estado" onchange="cambiarEstado(${pedido.id}, this.value)">
                        <option value="pendiente" ${pedido.estado === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                        <option value="en_proceso" ${pedido.estado === 'en_proceso' ? 'selected' : ''}>🔄 En Proceso</option>
                        <option value="completado" ${pedido.estado === 'completado' ? 'selected' : ''}>✅ Completado</option>
                        <option value="cancelado" ${pedido.estado === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
                    </select>
                    <button class="btn btn-sm btn-secondary" onclick="verDetalle(${pedido.id})">
                        👁️ Ver
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ============================================
// CAMBIAR ESTADO
// ============================================
async function cambiarEstado(pedidoId, nuevoEstado) {
    try {
        await fetchAPI(`/pedidos-herramientas/${pedidoId}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        showToast(`Estado actualizado: ${estadoLabel(nuevoEstado)}`, 'success');
        cargarPedidos();
    } catch (err) {
        showToast(`Error: ${err.message}`, 'error');
        cargarPedidos(); // Restaurar
    }
}

// ============================================
// VER DETALLE DE PEDIDO
// ============================================
async function verDetalle(pedidoId) {
    try {
        const pedido = await fetchAPI(`/pedidos-herramientas/${pedidoId}`);
        const modal = document.getElementById('modal-detalle');
        const body = document.getElementById('modal-pedido-body');
        const iconos = { 'Pico': '⛏️', 'Zapapico': '🪓' };

        document.getElementById('modal-pedido-titulo').textContent =
            `Pedido #${String(pedido.id).padStart(4, '0')}`;

        const items = (pedido.items || []).map(item => `
            <div class="item-row">
                <span class="item-icon">${iconos[item.tipo] || '🔧'}</span>
                <div class="item-info">
                    <div class="item-nombre">${item.tipo} ${item.marca}</div>
                    <div class="item-detalle">${item.cantidad} unidades</div>
                </div>
                <div class="item-mo">
                    <div class="item-mo-amount">${formatCurrency(item.mano_obra)}</div>
                    <div class="item-mo-label">Mano de Obra</div>
                </div>
            </div>
        `).join('');

        body.innerHTML = `
            <div style="padding: 1.5rem;">
                <div style="display:flex; gap:1rem; flex-wrap:wrap; margin-bottom:1rem;">
                    <div><strong>Comprador:</strong> ${pedido.comprador_nombre}</div>
                    <div><strong>Estado:</strong> <span class="badge-estado badge-${pedido.estado}">${estadoLabel(pedido.estado)}</span></div>
                    <div><strong>Fecha:</strong> ${new Date(pedido.created_at).toLocaleString('es-PE')}</div>
                </div>
                ${pedido.notas ? `<div style="margin-bottom:1rem;"><strong>Notas:</strong> ${pedido.notas}</div>` : ''}
                <div class="items-list">${items || '<div class="items-empty"><span>📦</span><p>Sin items</p></div>'}</div>
                <div class="pedido-resumen" style="display:block;">
                    <div class="resumen-row resumen-total">
                        <span>Total Mano de Obra:</span>
                        <strong>${formatCurrency(pedido.total_mano_obra)}</strong>
                    </div>
                </div>
            </div>`;

        modal.style.display = 'flex';
    } catch (err) {
        showToast(`Error al cargar detalle: ${err.message}`, 'error');
    }
}

function closePedidoModal() {
    document.getElementById('modal-detalle').style.display = 'none';
}

// ============================================
// HELPERS
// ============================================
function estadoLabel(estado) {
    const labels = {
        pendiente: '⏳ Pendiente',
        en_proceso: '🔄 En Proceso',
        completado: '✅ Completado',
        cancelado: '❌ Cancelado'
    };
    return labels[estado] || estado;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
