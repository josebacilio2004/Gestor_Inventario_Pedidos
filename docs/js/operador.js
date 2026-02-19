// ============================================================
// OPERADOR DASHBOARD - JAVASCRIPT COMPLETO
// ============================================================

let operadorSesion = null;
let itemsPedido = [];
let compradores = [];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    verificarSesion();
    await cargarCompradores();
    await cargarPedidos();

    // Auto-calcular al cambiar tipo, marca o cantidad
    ['tipo-herramienta', 'marca-herramienta'].forEach(id => {
        document.getElementById(id).addEventListener('change', actualizarPreviewMO);
    });
    document.getElementById('cantidad-herramienta').addEventListener('input', actualizarPreviewMO);

    // Enviar con Enter en cantidad
    document.getElementById('cantidad-herramienta').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); agregarItem(); }
    });

    document.getElementById('form-nuevo-pedido').addEventListener('submit', guardarPedido);
});

// ============================================================
// SESIÓN
// ============================================================
function verificarSesion() {
    const sesion = localStorage.getItem('operador_sesion');
    if (!sesion) { window.location.href = '../login.html'; return; }
    operadorSesion = JSON.parse(sesion);
    const nombre = operadorSesion.nombre || 'Operador';
    document.getElementById('operador-nombre').textContent = nombre.split(' ')[0];
    document.getElementById('operador-nombre-nav').textContent = nombre;
}

function logout() {
    localStorage.removeItem('operador_sesion');
    window.location.href = '../login.html';
}

// ============================================================
// CARGAR COMPRADORES — Con reintentos y feedback visual
// ============================================================
async function cargarCompradores() {
    const select = document.getElementById('select-comprador');
    select.innerHTML = '<option value="">⏳ Cargando compradores...</option>';
    select.disabled = true;

    try {
        const data = await fetchAPI('/compradores');
        compradores = Array.isArray(data) ? data : [];

        if (compradores.length === 0) {
            select.innerHTML = '<option value="">— Sin compradores registrados —</option>';
        } else {
            select.innerHTML = '<option value="">— Seleccionar comprador —</option>';
            compradores.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = `👤 ${c.nombre}`;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        select.innerHTML = '<option value="">❌ Error al cargar (reintenta)</option>';
        showToast('Error al cargar compradores. Verifica la conexión.', 'error');
        console.error('cargarCompradores:', err);
    } finally {
        select.disabled = false;
    }
}

// ============================================================
// CALCULADORA EN TIEMPO REAL (auto, sin botón)
// ============================================================
function actualizarPreviewMO() {
    const tipo = document.getElementById('tipo-herramienta').value;
    const marca = document.getElementById('marca-herramienta').value;
    const cantidad = parseInt(document.getElementById('cantidad-herramienta').value) || 0;

    const mo = calcularManoObra(tipo, marca, cantidad);
    const cfg = TARIFAS_MANO_OBRA[`${tipo}-${marca}`];
    const preview = document.getElementById('mo-amount-preview');
    const calc = document.getElementById('mo-calc-preview');
    const addBtn = document.getElementById('btn-agregar');

    // Animar cambio
    preview.classList.remove('mo-updated');
    void preview.offsetWidth; // reflow para reiniciar animación
    preview.classList.add('mo-updated');

    preview.textContent = formatCurrency(mo);

    if (cfg && cantidad > 0) {
        calc.textContent = `${cantidad} ud ÷ ${cfg.base} × S/${cfg.tarifa} = ${formatCurrency(mo)}`;
        addBtn.disabled = false;
        addBtn.classList.add('btn-ready');
    } else {
        calc.textContent = cantidad > 0 ? 'Elige tipo y marca' : 'Ingresa la cantidad';
        addBtn.disabled = false;
        addBtn.classList.remove('btn-ready');
    }
}

// ============================================================
// AGREGAR ITEM
// ============================================================
function agregarItem() {
    const tipo = document.getElementById('tipo-herramienta').value;
    const marca = document.getElementById('marca-herramienta').value;
    const input = document.getElementById('cantidad-herramienta');
    const cantidad = parseInt(input.value);

    if (!cantidad || cantidad <= 0) {
        input.classList.add('input-error');
        showToast('⚠️ Ingresa una cantidad válida', 'error');
        input.focus();
        setTimeout(() => input.classList.remove('input-error'), 1000);
        return;
    }

    // Vibración en iPhone (si está disponible)
    if (navigator.vibrate) navigator.vibrate(30);

    const manoObra = calcularManoObra(tipo, marca, cantidad);
    const id = Date.now();
    itemsPedido.push({ id, tipo, marca, cantidad, mano_obra: manoObra });

    renderItems();
    updateResumen();

    // Limpiar y enfocar para el siguiente item
    input.value = '';
    actualizarPreviewMO();
    input.focus();

    // Feedback visual en botón
    const btn = document.getElementById('btn-agregar');
    btn.textContent = '✅ Agregado!';
    btn.style.background = 'var(--success)';
    setTimeout(() => {
        btn.textContent = '➕ Agregar';
        btn.style.background = '';
    }, 1200);
}

// ============================================================
// ELIMINAR ITEM
// ============================================================
function eliminarItem(id) {
    const el = document.getElementById(`item-${id}`);
    if (el) {
        el.classList.add('item-removing');
        setTimeout(() => {
            itemsPedido = itemsPedido.filter(i => i.id !== id);
            renderItems();
            updateResumen();
        }, 250);
    }
}

// ============================================================
// RENDER ITEMS
// ============================================================
function renderItems() {
    const container = document.getElementById('items-list');
    const iconos = { 'Pico': '⛏️', 'Zapapico': '🪓' };

    if (itemsPedido.length === 0) {
        container.innerHTML = `
            <div class="items-empty">
                <span>📦</span>
                <p>Agrega herramientas arriba</p>
                <small>Usa los campos de tipo, marca y cantidad</small>
            </div>`;
        return;
    }

    container.innerHTML = itemsPedido.map(item => {
        const cfg = TARIFAS_MANO_OBRA[`${item.tipo}-${item.marca}`];
        return `
        <div class="item-row" id="item-${item.id}">
            <span class="item-icon">${iconos[item.tipo] || '🔧'}</span>
            <div class="item-info">
                <div class="item-nombre">${item.tipo} <strong>${item.marca}</strong></div>
                <div class="item-detalle">
                    <span class="cantidad-badge">${item.cantidad} und</span>
                    <span class="tarifa-badge">S/${cfg?.tarifa || 0}/120ud</span>
                </div>
            </div>
            <div class="item-mo">
                <div class="item-mo-amount">${formatCurrency(item.mano_obra)}</div>
                <div class="item-mo-label">M. Obra</div>
            </div>
            <button class="item-delete" onclick="eliminarItem(${item.id})" title="Quitar item">
                <span>✕</span>
            </button>
        </div>`;
    }).join('');
}

// ============================================================
// RESUMEN TOTAL — Con animación de número
// ============================================================
function updateResumen() {
    const resumen = document.getElementById('pedido-resumen');
    const totalItems = itemsPedido.reduce((s, i) => s + i.cantidad, 0);
    const totalMO = itemsPedido.reduce((s, i) => s + i.mano_obra, 0);
    const tiposCount = itemsPedido.length;

    if (tiposCount > 0) {
        resumen.style.display = 'block';
        resumen.classList.add('resumen-show');
        document.getElementById('resumen-items').textContent = `${tiposCount} tipo(s) · ${totalItems} und`;
        const moEl = document.getElementById('resumen-mano-obra');
        moEl.textContent = formatCurrency(totalMO);
        moEl.classList.add('amount-updated');
        setTimeout(() => moEl.classList.remove('amount-updated'), 500);
    } else {
        resumen.classList.remove('resumen-show');
        setTimeout(() => { resumen.style.display = 'none'; }, 300);
    }
}

// ============================================================
// GUARDAR PEDIDO
// ============================================================
async function guardarPedido(e) {
    e.preventDefault();

    const compradorId = document.getElementById('select-comprador').value;
    if (!compradorId) {
        document.getElementById('select-comprador').classList.add('input-error');
        showToast('⚠️ Selecciona un comprador', 'error');
        setTimeout(() => document.getElementById('select-comprador').classList.remove('input-error'), 1500);
        return;
    }
    if (itemsPedido.length === 0) {
        showToast('⚠️ Agrega al menos una herramienta', 'error');
        return;
    }

    const btn = document.getElementById('btn-guardar-pedido');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Guardando...';

    try {
        const payload = {
            operador_id: operadorSesion.id,
            comprador_id: parseInt(compradorId),
            notas: document.getElementById('notas-pedido').value,
            items: itemsPedido.map(({ tipo, marca, cantidad }) => ({ tipo, marca, cantidad }))
        };

        await fetchAPI('/pedidos-herramientas', { method: 'POST', body: JSON.stringify(payload) });

        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        showToast('✅ Pedido guardado exitosamente!', 'success');
        limpiarFormulario();
        await cargarPedidos();

        // Scroll a pedidos
        document.getElementById('pedidos').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        showToast(`❌ Error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '💾 Guardar Pedido';
    }
}

// ============================================================
// LIMPIAR FORMULARIO
// ============================================================
function limpiarFormulario() {
    itemsPedido = [];
    renderItems();
    updateResumen();
    document.getElementById('notas-pedido').value = '';
    document.getElementById('select-comprador').value = '';
    document.getElementById('cantidad-herramienta').value = '';
    actualizarPreviewMO();
}

// ============================================================
// CARGAR PEDIDOS
// ============================================================
async function cargarPedidos() {
    const container = document.getElementById('pedidos-container');
    const estado = document.getElementById('filtro-estado').value;

    container.innerHTML = `
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>`;

    try {
        let url = `/pedidos-herramientas`;
        const params = [];
        if (operadorSesion?.id) params.push(`operador_id=${operadorSesion.id}`);
        if (estado) params.push(`estado=${estado}`);
        if (params.length) url += '?' + params.join('&');

        const pedidos = await fetchAPI(url);
        actualizarStats(pedidos);
        renderPedidos(pedidos);
    } catch (err) {
        container.innerHTML = `
            <div class="error-state">
                <span>⚠️</span>
                <p>No se pudieron cargar los pedidos</p>
                <button class="btn btn-secondary" onclick="cargarPedidos()">🔄 Reintentar</button>
            </div>`;
        console.error('cargarPedidos:', err);
    }
}

// Contadores del header
function actualizarStats(pedidos) {
    document.getElementById('count-pendiente').textContent = pedidos.filter(p => p.estado === 'pendiente').length;
    document.getElementById('count-proceso').textContent = pedidos.filter(p => p.estado === 'en_proceso').length;
    document.getElementById('count-completado').textContent = pedidos.filter(p => p.estado === 'completado').length;
}

// ============================================================
// RENDER PEDIDOS — Cards interactivas
// ============================================================
function renderPedidos(pedidos) {
    const container = document.getElementById('pedidos-container');
    const iconos = { 'Pico': '⛏️', 'Zapapico': '🪓' };

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="items-empty" style="padding:2.5rem 1rem;">
                <span>📋</span>
                <p>No hay pedidos aún</p>
                <small>Crea tu primer pedido arriba ↑</small>
            </div>`;
        return;
    }

    container.innerHTML = pedidos.map(pedido => {
        const items = pedido.items || [];
        const fecha = new Date(pedido.created_at).toLocaleDateString('es-PE', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
        const tagsHTML = items.map(i =>
            `<span class="item-tag">${iconos[i.tipo] || '🔧'} ${i.tipo} ${i.marca} ×${i.cantidad}</span>`
        ).join('') || `<span class="item-tag" style="color:var(--text-secondary)">Sin items</span>`;

        return `
        <div class="pedido-card" onclick="verDetalle(${pedido.id})" style="cursor:pointer;">
            <div class="pedido-card-header">
                <div>
                    <div class="pedido-card-id">#${String(pedido.id).padStart(4, '0')} · ${fecha}</div>
                    <div class="pedido-card-comprador">👤 ${pedido.comprador_nombre || 'Sin comprador'}</div>
                </div>
                <span class="badge-estado badge-${pedido.estado}">${estadoLabel(pedido.estado)}</span>
            </div>
            <div class="pedido-card-body">
                <div class="pedido-items-preview">${tagsHTML}</div>
                ${pedido.notas ? `<p class="pedido-nota">📝 ${pedido.notas}</p>` : ''}
            </div>
            <div class="pedido-card-footer" onclick="event.stopPropagation()">
                <div class="pedido-mano-obra">🔧 ${formatCurrency(pedido.total_mano_obra)}</div>
                <div class="pedido-actions">
                    <select class="select-estado badge-estado badge-${pedido.estado}"
                            onchange="cambiarEstado(${pedido.id}, this.value, this)">
                        <option value="pendiente"   ${pedido.estado === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                        <option value="en_proceso"  ${pedido.estado === 'en_proceso' ? 'selected' : ''}>🔄 En Proceso</option>
                        <option value="completado"  ${pedido.estado === 'completado' ? 'selected' : ''}>✅ Completado</option>
                        <option value="cancelado"   ${pedido.estado === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
                    </select>
                    <button class="btn-icon-ver" onclick="verDetalle(${pedido.id})">👁️</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ============================================================
// CAMBIAR ESTADO — Con feedback inmediato
// ============================================================
async function cambiarEstado(pedidoId, nuevoEstado, selectEl) {
    const prev = selectEl ? Array.from(selectEl.options).find(o => o.selected)?.value : null;
    try {
        await fetchAPI(`/pedidos-herramientas/${pedidoId}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (navigator.vibrate) navigator.vibrate(20);
        showToast(`✅ ${estadoLabel(nuevoEstado)}`, 'success');
        // Actualizar clase del select sin recargar todo
        if (selectEl) {
            selectEl.className = `select-estado badge-estado badge-${nuevoEstado}`;
        }
        cargarPedidos();
    } catch (err) {
        showToast(`❌ Error: ${err.message}`, 'error');
        cargarPedidos(); // restaurar
    }
}

// ============================================================
// MODAL DETALLE
// ============================================================
async function verDetalle(pedidoId) {
    const modal = document.getElementById('modal-detalle');
    const body = document.getElementById('modal-pedido-body');
    const iconos = { 'Pico': '⛏️', 'Zapapico': '🪓' };

    modal.style.display = 'flex';
    body.innerHTML = `<div style="padding:2rem;text-align:center;">
        <div class="spinner-lg"></div><p>Cargando...</p></div>`;

    try {
        const pedido = await fetchAPI(`/pedidos-herramientas/${pedidoId}`);
        document.getElementById('modal-pedido-titulo').textContent =
            `Pedido #${String(pedido.id).padStart(4, '0')}`;

        const itemsHTML = (pedido.items || []).map(item => `
            <div class="item-row">
                <span class="item-icon">${iconos[item.tipo] || '🔧'}</span>
                <div class="item-info">
                    <div class="item-nombre">${item.tipo} <strong>${item.marca}</strong></div>
                    <div class="item-detalle"><span class="cantidad-badge">${item.cantidad} und</span></div>
                </div>
                <div class="item-mo">
                    <div class="item-mo-amount">${formatCurrency(item.mano_obra)}</div>
                    <div class="item-mo-label">M. Obra</div>
                </div>
            </div>`).join('');

        body.innerHTML = `
            <div style="padding:1.25rem 1.5rem;">
                <div class="detalle-meta">
                    <div class="detalle-meta-item">
                        <label>Comprador</label>
                        <span>👤 ${pedido.comprador_nombre || '—'}</span>
                    </div>
                    <div class="detalle-meta-item">
                        <label>Estado</label>
                        <span class="badge-estado badge-${pedido.estado}">${estadoLabel(pedido.estado)}</span>
                    </div>
                    <div class="detalle-meta-item">
                        <label>Fecha</label>
                        <span>${new Date(pedido.created_at).toLocaleString('es-PE')}</span>
                    </div>
                </div>
                ${pedido.notas ? `<div class="detalle-nota">📝 ${pedido.notas}</div>` : ''}
                <div class="items-list" style="margin:1rem 0;">
                    ${itemsHTML || '<div class="items-empty"><span>📦</span><p>Sin items</p></div>'}
                </div>
                <div class="pedido-resumen" style="display:block;">
                    <div class="resumen-row resumen-total">
                        <span>Total Mano de Obra</span>
                        <strong>${formatCurrency(pedido.total_mano_obra)}</strong>
                    </div>
                </div>
            </div>`;
    } catch (err) {
        body.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--danger);">
            ❌ No se pudo cargar el detalle<br>
            <button class="btn btn-secondary" onclick="verDetalle(${pedidoId})" style="margin-top:1rem;">Reintentar</button>
        </div>`;
    }
}

function closePedidoModal() {
    document.getElementById('modal-detalle').style.display = 'none';
}

// Cerrar modal con ESC
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePedidoModal();
});

// ============================================================
// HELPERS
// ============================================================
function estadoLabel(estado) {
    return {
        pendiente: '⏳ Pendiente', en_proceso: '🔄 En Proceso',
        completado: '✅ Completado', cancelado: '❌ Cancelado'
    }[estado] || estado;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 350);
    }, 3000);
}
