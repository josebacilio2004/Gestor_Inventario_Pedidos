// ============================================================
// OPERADOR DASHBOARD - JAVASCRIPT COMPLETO
// Incluye: sesión, tandas, compradores, stock, pedidos
// ============================================================

let operadorSesion = null;
let itemsPedido = [];
let compradores = [];
let stockActual = {};   // { 'Pico': 240, 'Zapapico': 180 }
let tandaActiva = null; // objeto tanda activa actual
let tandaVisualizadaId = null;
let tandaVisualizadaNombre = 'Tanda Activa';

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
    verificarSesion();
    // Cargar todo en paralelo (las tandas primero para tener tanda activa)
    await cargarTandas();
    await Promise.all([cargarCompradores(), cargarStock(), cargarStockPendiente()]);
    await cargarPedidos();

    // Auto-calcular MO + mostrar stock disponible al cambiar selects
    ['tipo-herramienta', 'marca-herramienta'].forEach(id => {
        document.getElementById(id)?.addEventListener('change', () => {
            actualizarPreviewMO();
            mostrarStockEnFormulario();
        });
    });
    document.getElementById('cantidad-herramienta')?.addEventListener('input', actualizarPreviewMO);
    document.getElementById('cantidad-herramienta')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); agregarItem(); }
    });

    document.getElementById('form-nuevo-pedido')?.addEventListener('submit', guardarPedido);
    actualizarPreviewMO();
    mostrarStockEnFormulario();
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
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = '../login.html';
}

// ============================================================
// STOCK PENDIENTE DE INVERSIONISTAS
// ============================================================
async function cargarStockPendiente() {
    const lista = document.getElementById('stock-pendiente-lista');
    if (!lista) return;

    try {
        const pedidos = await fetchAPI('/pedidos/stock-pendiente');

        if (!pedidos || pedidos.length === 0) {
            lista.innerHTML = '<p class="text-secondary text-center" style="padding:1.5rem;">✅ No hay herramientas pendientes por asignar a la tanda activa.</p>';
            return;
        }

        lista.innerHTML = pedidos.map(p => `
            <div style="border:1px solid #e2e8f0; border-radius:8px; padding:1rem; margin-bottom:1rem; background:#f8fafc;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.75rem; flex-wrap:wrap; gap:0.5rem;">
                    <div>
                        <h4 style="margin:0; color:#1e293b; font-size:1rem;">Pedido #${p.pedido_id} — ${p.inversionista_nombre || 'Desconocido'}</h4>
                        <p style="margin:0; font-size:0.8rem; color:#64748b;">${new Date(p.fecha_pedido).toLocaleDateString('es-PE')} · Pedido total: ${p.cantidad_total} uds (${p.producto_nombre})</p>
                    </div>
                </div>
                
                <div style="background:white; border:1px solid #cbd5e1; border-radius:6px; padding:0.75rem;">
                    <p style="margin:0 0 0.5rem 0; font-size:0.85rem; font-weight:600; color:#334155;">Selecciona la marca para asignar a la tanda activa:</p>
                    
                    <div id="items-stock-${p.pedido_id}" style="display:grid; gap:0.5rem;">
                        ${p.herramientas.map(h => `
                            <div class="stock-item-row" data-tipo="${h.tipo}" style="display:flex; align-items:center; gap:1rem; background:#f1f5f9; padding:0.5rem 0.75rem; border-radius:4px;">
                                <div style="flex:1;">
                                    <span style="font-weight:700; color:#0f172a;">${h.producto_nombre_especifico || h.tipo}</span> 
                                    <span style="color:#475569; font-size:0.9rem;">(${h.cantidad} uds)</span>
                                </div>
                                <select class="marca-select form-control" style="width:140px; padding:0.25rem 0.5rem; height:auto; margin:0;">
                                    <option value="Tramontina">Tramontina</option>
                                    <option value="Bellota">Bellota</option>
                                </select>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div style="margin-top:0.75rem; display:flex; justify-content:space-between; align-items:center;">
                        <div style="font-size:0.75rem; color:#64748b;">
                            Marcar todos: 
                            <button class="btn-link" onclick="document.querySelectorAll('#items-stock-${p.pedido_id} .marca-select').forEach(s=>s.value='Tramontina')" style="color:#2563eb; padding:0 5px; font-weight:600;">T</button>
                            <button class="btn-link" onclick="document.querySelectorAll('#items-stock-${p.pedido_id} .marca-select').forEach(s=>s.value='Bellota')" style="color:#2563eb; padding:0 5px; font-weight:600;">B</button>
                        </div>
                        <button class="btn btn-primary" onclick="asignarStockAGrupo(${p.pedido_id})" style="padding:0.4rem 1rem; font-size:0.9rem;">
                            ✅ Asignar a Tanda
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error('Error al cargar stock pendiente:', err);
        lista.innerHTML = '<p class="text-danger text-center">❌ Error al cargar los pedidos pendientes.</p>';
    }
}

async function asignarStockAGrupo(pedidoId) {
    if (!tandaActiva) {
        return showToast('No hay ninguna tanda activa seleccionada', 'warning');
    }

    const container = document.getElementById(`items-stock-${pedidoId}`);
    const rows = container.querySelectorAll('.stock-item-row');
    const items = Array.from(rows).map(row => ({
        tipo: row.dataset.tipo,
        marca: row.querySelector('.marca-select').value
    }));

    let btn, oldText;
    try {
        btn = container.nextElementSibling.querySelector('button');
        oldText = btn.innerHTML;
        btn.innerHTML = 'Asignando...';
        btn.disabled = true;

        await fetchAPI(`/pedidos/${pedidoId}/asignar-stock`, {
            method: 'POST',
            body: JSON.stringify({ items })
        });

        showToast('Stock asignado correctamente a la tanda activa', 'success');

        // Recargar listas para reflejar el cambio
        await Promise.all([cargarStockPendiente(), cargarStock()]);

    } catch (err) {
        showToast(err.message || 'Error al asignar stock', 'error');
        if (btn) {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    }
}

// ============================================================
// GESTIÓN DE TANDAS
// ============================================================
async function cargarTandas() {
    try {
        const data = await fetchAPI('/tandas');
        // Buscar tanda activa
        tandaActiva = data.find(t => t.estado === 'activa') || null;

        // Inicializar vista con la tanda activa por defecto
        if (tandaActiva && !tandaVisualizadaId) {
            tandaVisualizadaId = tandaActiva.id;
            tandaVisualizadaNombre = tandaActiva.nombre;
        }

        renderBannerTandaActiva();
        renderHistorialTandas(data);
    } catch (err) {
        console.error('Error al cargar tandas:', err);
        tandaActiva = null;
        renderBannerTandaActiva();
        document.getElementById('tandas-historial').innerHTML =
            `<div style="padding:.75rem;color:#ef4444;font-size:.85rem;">⚠️ No se pudieron cargar las tandas</div>`;
    }
}

function renderBannerTandaActiva() {
    const bannerActiva = document.getElementById('tanda-activa-banner');
    const bannerSin = document.getElementById('sin-tanda-banner');
    const btnForm = document.getElementById('btn-toggle-nueva-tanda');

    if (tandaActiva) {
        bannerActiva.style.display = 'block';
        bannerSin.style.display = 'none';
        document.getElementById('tanda-activa-nombre').textContent = `🏭 ${tandaActiva.nombre}`;
        // Parsear DATE como local (evita desfase UTC -5h)
        const [fy, fm, fd] = tandaActiva.fecha_inicio.slice(0, 10).split('-').map(Number);
        const fechaInicio = new Date(fy, fm - 1, fd).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
        const pedidos = Number(tandaActiva.total_pedidos ?? 0);
        document.getElementById('tanda-activa-meta').textContent =
            `Activa desde ${fechaInicio} · ${pedidos} pedido(s) registrados`;
        if (btnForm) btnForm.textContent = '＋ Nueva Tanda';
    } else {
        bannerActiva.style.display = 'none';
        bannerSin.style.display = 'block';
        if (btnForm) btnForm.textContent = '🚀 Crear Primera Tanda';
    }
    actualizarVisibilidadSecciones();
}

// Muestra u oculta las secciones de Stock y Pedido según si hay tanda activa
function actualizarVisibilidadSecciones() {
    const activa = !!tandaActiva;

    // Stock
    const stockBloq = document.getElementById('stock-bloqueado');
    const stockCont = document.getElementById('stock-contenido');
    if (stockBloq) stockBloq.style.display = activa ? 'none' : 'block';
    if (stockCont) stockCont.style.display = activa ? 'block' : 'none';

    // Pedido
    const pedidoBloq = document.getElementById('pedido-bloqueado');
    const pedidoCont = document.getElementById('pedido-contenido');
    if (pedidoBloq) pedidoBloq.style.display = activa ? 'none' : 'block';
    if (pedidoCont) pedidoCont.style.display = activa ? 'block' : 'none';
}

// Helper: scroll hacia el panel de tandas y abre el formulario
function scrollYCrearTanda() {
    document.getElementById('tandas').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
        if (document.getElementById('form-tanda-container').style.display === 'none') {
            toggleFormTanda();
        }
    }, 350);
}

function renderHistorialTandas(tandas) {
    const el = document.getElementById('tandas-historial');
    if (!tandas.length) {
        el.innerHTML = `
            <div style="padding:1.5rem; text-align:center; color:#94a3b8;">
                <div style="font-size:2rem; margin-bottom:.5rem;">🏭</div>
                <p style="font-weight:600;">No hay tandas registradas</p>
                <p style="font-size:.78rem;">Crea la primera tanda para comenzar</p>
            </div>`;
        return;
    }

    const colores = {
        activa: { bg: '#ecfdf5', border: '#6ee7b7', badge: '#059669', label: '🟢 Activa' },
        cerrada: { bg: '#f8fafc', border: '#e2e8f0', badge: '#64748b', label: '⚫ Cerrada' },
        pausada: { bg: '#fff7ed', border: '#fed7aa', badge: '#ea580c', label: '⏸️ Pausada' },
    };

    // Parsea "YYYY-MM-DD" como fecha LOCAL (evita desfase UTC -5h)
    function parseFecha(str) {
        if (!str) return null;
        const [y, m, d] = str.slice(0, 10).split('-').map(Number);
        return new Date(y, m - 1, d);
    }
    const fmtCorto = { day: '2-digit', month: 'short', year: 'numeric' };

    el.innerHTML = tandas.map(t => {
        const c = colores[t.estado] || colores.cerrada;
        const fechaInicio = parseFecha(t.fecha_inicio)?.toLocaleDateString('es-PE', fmtCorto) ?? '—';
        const fechaCierre = t.fecha_cierre
            ? parseFecha(t.fecha_cierre).toLocaleDateString('es-PE', fmtCorto)
            : '—';
        const totalMO = t.total_mano_obra != null && Number(t.total_mano_obra) > 0 ? Number(t.total_mano_obra) : 0;
        const totalPagado = t.total_pagado != null ? Number(t.total_pagado) : 0;
        const saldo = Math.max(0, totalMO - totalPagado);

        let metaHtml = '';
        if (totalMO > 0) {
            metaHtml = `
            <div style="display:flex; justify-content:flex-end; gap:0.5rem; text-align:right; margin-bottom:0.4rem;">
                <div>
                    <div style="font-size:.78rem; color:#059669; font-weight:700;">S/ ${totalPagado.toFixed(2)}</div>
                    <div style="font-size:.65rem;color:#64748b;text-transform:uppercase;">Pagado</div>
                </div>
                <div>
                    <div style="font-size:.78rem; color:#e11d48; font-weight:700;">S/ ${saldo.toFixed(2)}</div>
                    <div style="font-size:.65rem;color:#64748b;text-transform:uppercase;">Deuda</div>
                </div>
            </div>
            <button class="btn btn-sm" onclick="abrirPagosModal(${t.id}, '${t.nombre.replace(/'/g, "\\'")}', ${totalMO}, ${totalPagado})" 
                style="font-size:0.7rem; padding:0.25rem 0.5rem; width:100%; border:1px solid #cbd5e1; background:white; cursor:pointer; color:#1a365d; font-weight:600; margin-bottom: 4px;">
                💰 Gestionar Pagos
            </button>
            <button class="btn btn-sm btn-secondary" onclick="cargarPedidos(${t.id}, '${t.nombre.replace(/'/g, "\\'")}')" 
                style="font-size:0.7rem; padding:0.25rem 0.5rem; width:100%; font-weight:600;">
                📂 Ver Pedidos
            </button>
            `;
        }

        return `
        <div class="tanda-item" style="background:${c.bg}; border-color:${c.border};">
            <div class="tanda-item-left">
                <span class="tanda-badge" style="color:${c.badge};">${c.label}</span>
                <div class="tanda-nombre">${t.nombre}</div>
                <div class="tanda-meta">
                    📅 ${fechaInicio}
                    ${t.estado !== 'activa' ? ` → ${fechaCierre}` : ''}
                    · 📋 ${Number(t.total_pedidos ?? 0)} pedido(s)
                </div>
            </div>
            <div class="tanda-item-right" style="min-width:130px;">
                ${t.total_stock != null ? `<div class="tanda-stock-total">${Number(t.total_stock).toLocaleString('es-PE')} und</div><div style="font-size:.68rem;color:#64748b;margin-bottom:0.5rem;">stock restante</div>` : ''}
                ${metaHtml}
            </div>
        </div>`;
    }).join('');
}


function toggleFormTanda() {
    const form = document.getElementById('form-tanda-container');
    const isHidden = form.style.display === 'none';
    form.style.display = isHidden ? 'block' : 'none';
    const btn = document.getElementById('btn-toggle-nueva-tanda');
    btn.textContent = isHidden ? '✕ Cancelar' : (tandaActiva ? '＋ Nueva Tanda' : '🚀 Crear Primera Tanda');
    if (isHidden) document.getElementById('tanda-nombre').focus();
}

async function crearTanda() {
    const nombre = document.getElementById('tanda-nombre').value.trim();
    const picos = parseInt(document.getElementById('tanda-picos').value) || 0;
    const zapapicos = parseInt(document.getElementById('tanda-zapapicos').value) || 0;
    const descripcion = document.getElementById('tanda-descripcion').value.trim();

    if (!nombre) {
        document.getElementById('tanda-nombre').classList.add('input-error');
        showToast('⚠️ Ingresa un nombre para la tanda', 'error');
        setTimeout(() => document.getElementById('tanda-nombre').classList.remove('input-error'), 1200);
        return;
    }

    const btn = document.getElementById('btn-crear-tanda');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Creando...';

    try {
        const data = await fetchAPI('/tandas', {
            method: 'POST',
            body: JSON.stringify({
                nombre,
                descripcion: descripcion || null,
                operador_id: operadorSesion?.id || null,
                picos,
                zapapicos,
                minimo_alerta: 100
            })
        });

        if (navigator.vibrate) navigator.vibrate([30, 20, 50]);
        showToast(`✅ Tanda "${data.nombre}" creada con éxito`, 'success');

        // Limpiar y cerrar form
        document.getElementById('tanda-nombre').value = '';
        document.getElementById('tanda-picos').value = '0';
        document.getElementById('tanda-zapapicos').value = '0';
        document.getElementById('tanda-descripcion').value = '';
        document.getElementById('form-tanda-container').style.display = 'none';
        document.getElementById('btn-toggle-nueva-tanda').textContent = '＋ Nueva Tanda';

        // Recargar tandas y stock
        tandaVisualizadaId = null; // Forzar que cargue la nueva tanda activa
        await cargarTandas();
        await cargarStock();
        await cargarPedidos();
    } catch (err) {
        showToast(`❌ Error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🚀 Crear Tanda';
    }
}

async function cerrarTandaActiva() {
    if (!tandaActiva) return;
    if (!confirm(`¿Seguro que deseas cerrar la tanda "${tandaActiva.nombre}"?\nNo podrás agregar más pedidos a esta tanda.`)) return;

    const btn = document.getElementById('btn-cerrar-tanda');
    if (btn) { btn.disabled = true; btn.textContent = 'Cerrando...'; }

    try {
        await fetchAPI(`/tandas/${tandaActiva.id}/cerrar`, { method: 'PATCH' });
        showToast(`🔒 Tanda "${tandaActiva.nombre}" cerrada`, 'info');
        tandaActiva = null;
        tandaVisualizadaId = null;
        await cargarTandas();
        await cargarStock();
        await cargarPedidos(); // Recargar para limpiar lista si no hay activa
    } catch (err) {
        showToast(`❌ Error: ${err.message}`, 'error');
        if (btn) { btn.disabled = false; btn.textContent = '🔒 Cerrar Tanda'; }
    }
}


// ============================================================
// CARGAR COMPRADORES
// ============================================================
async function cargarCompradores() {
    const select = document.getElementById('select-comprador');
    select.innerHTML = '<option value="">⏳ Cargando...</option>';
    select.disabled = true;
    try {
        const data = await fetchAPI('/compradores');
        compradores = Array.isArray(data) ? data : [];
        if (compradores.length === 0) {
            select.innerHTML = '<option value="">— Sin compradores —</option>';
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
        select.innerHTML = '<option value="">❌ Error al cargar</option>';
        showToast('Error al cargar compradores.', 'error');
    } finally {
        select.disabled = false;
    }
}

// ============================================================
// STOCK — cargar y renderizar
// ============================================================
async function cargarStock() {
    const grid = document.getElementById('stock-grid');
    if (!grid) return;
    try {
        const data = await fetchAPI('/stock-herramientas');
        // Guardar en mapa para consulta rápida
        stockActual = {};
        data.forEach(s => { stockActual[s.tipo] = s.cantidad; });  // key = tipo only
        renderStock(data);
        mostrarStockEnFormulario();  // refrescar etiqueta en formulario
    } catch (err) {
        grid.innerHTML = `<div style="color:#ef4444;padding:1rem;">⚠️ No se pudo cargar el stock</div>`;
    }
}

function renderStock(data) {
    const grid = document.getElementById('stock-grid');
    if (!grid) return;

    const iconos = { Pico: '⛏️', Zapapico: '🪓' };
    const colores = { agotado: '#ef4444', bajo: '#f97316', ok: '#10b981' };
    const labels = { agotado: '🔴 Agotado', bajo: '🟡 Stock bajo', ok: '🟢 Disponible' };

    grid.innerHTML = data.map(s => {
        const pct = s.minimo_alerta > 0 ? (s.cantidad / (s.minimo_alerta * 2)) * 100 : 50;
        const nivel = s.cantidad === 0 ? 'agotado' : s.cantidad <= s.minimo_alerta ? 'bajo' : 'ok';
        return `
        <div class="stock-card stock-${nivel}" onclick="preseleccionarStockForm('${s.tipo}')"
             style="cursor:pointer;" title="Click para seleccionar tipo en formulario">
            <div class="stock-card-top">
                <span class="stock-icon">${iconos[s.tipo] || '🔧'}</span>
                <div>
                    <div class="stock-nombre">${s.tipo}s (Tramontina + Bellota)</div>
                    <div class="stock-nivel-label" style="color:${colores[nivel]}">${labels[nivel]}</div>
                </div>
            </div>
            <div class="stock-cantidad">${s.cantidad.toLocaleString('es-PE')}<span class="stock-ud"> und</span></div>
            <div class="stock-bar-wrap">
                <div class="stock-bar" style="width:${Math.min(pct, 100)}%; background:${colores[nivel]};"></div>
            </div>
            <div class="stock-updated">Act: ${new Date(s.updated_at).toLocaleString('es-PE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</div>
        </div>`;
    }).join('');
}

// Preselecciona tipo en el formulario al hacer clic en stock-card
function preseleccionarStockForm(tipo) {
    document.getElementById('tipo-herramienta').value = tipo;
    actualizarPreviewMO();
    mostrarStockEnFormulario();
    document.getElementById('cantidad-herramienta').focus();
    document.getElementById('nuevo-pedido').scrollIntoView({ behavior: 'smooth' });
}

// Muestra el stock disponible debajo del campo cantidad (por tipo)
function mostrarStockEnFormulario() {
    const tipo = document.getElementById('tipo-herramienta').value;
    const disp = stockActual[tipo] ?? null;
    let el = document.getElementById('stock-disponible-label');
    if (!el) {
        el = document.createElement('div');
        el.id = 'stock-disponible-label';
        el.style.cssText = 'font-size:.75rem;margin-top:.3rem;font-weight:600;';
        document.getElementById('cantidad-herramienta').parentElement.appendChild(el);
    }
    if (disp === null) {
        el.textContent = '';
    } else if (disp === 0) {
        el.innerHTML = '🔴 Sin stock de ' + tipo + 's';
        el.style.color = '#ef4444';
    } else if (disp <= 100) {
        el.innerHTML = `🟡 Solo ${disp} ${tipo}s disponibles`;
        el.style.color = '#f97316';
    } else {
        el.innerHTML = `🟢 ${disp} ${tipo}s disponibles`;
        el.style.color = '#10b981';
    }
}

// ============================================================
// AGREGAR STOCK (desde el panel de inventario)
// ============================================================
async function agregarStock() {
    const tipo = document.getElementById('stock-tipo').value;
    const cantidad = parseInt(document.getElementById('stock-cantidad').value);
    const btn = document.getElementById('btn-agregar-stock');

    if (!cantidad || cantidad <= 0) {
        showToast('⚠️ Ingresa una cantidad válida', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Guardando...';
    try {
        await fetchAPI('/stock-herramientas/agregar', {
            method: 'POST',
            body: JSON.stringify({ tipo, cantidad })
        });
        document.getElementById('stock-cantidad').value = '';
        if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
        showToast(`✅ +${cantidad} ${tipo}s ingresados al inventario`, 'success');
        await cargarStock();
    } catch (err) {
        showToast(`❌ Error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '✅ Confirmar Ingreso';
    }
}

// ============================================================
// CALCULADORA MO EN TIEMPO REAL
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

    preview.classList.remove('mo-updated');
    void preview.offsetWidth;
    preview.classList.add('mo-updated');
    preview.textContent = formatCurrency(mo);

    if (cfg && cantidad > 0) {
        calc.textContent = `${cantidad} ud × S/${cfg.tarifa} = ${formatCurrency(mo)}`;
    } else {
        calc.textContent = cantidad > 0 ? 'Elige tipo y marca' : 'Ingresa la cantidad';
    }
    if (addBtn) addBtn.disabled = false;
}

// ============================================================
// AGREGAR ITEM AL PEDIDO (con validación de stock)
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

    // Verificar stock disponible
    // Verificar stock disponible por TIPO (sin distinción de marca)
    const disp = stockActual[tipo] ?? null;

    // Sumar lo ya comprometido en el formulario para ese tipo (todas las marcas)
    const comprometido = itemsPedido
        .filter(i => i.tipo === tipo)
        .reduce((s, i) => s + i.cantidad, 0);

    if (disp !== null && (comprometido + cantidad) > disp) {
        const restante = Math.max(0, disp - comprometido);
        showToast(`⚠️ Stock insuficiente. Solo ${restante} ${tipo}s disponibles en total.`, 'error');
        input.classList.add('input-error');
        setTimeout(() => input.classList.remove('input-error'), 1200);
        return;
    }

    if (navigator.vibrate) navigator.vibrate(30);
    const manoObra = calcularManoObra(tipo, marca, cantidad);
    itemsPedido.push({ id: Date.now(), tipo, marca, cantidad, mano_obra: manoObra });

    renderItems();
    updateResumen();
    input.value = '';
    actualizarPreviewMO();
    mostrarStockEnFormulario();
    input.focus();

    const btn = document.getElementById('btn-agregar');
    if (btn) {
        btn.textContent = '✅ Agregado!';
        btn.style.background = '#10b981';
        setTimeout(() => { btn.textContent = '➕ Agregar'; btn.style.background = ''; }, 1200);
    }
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
            mostrarStockEnFormulario();
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
                    <span class="tarifa-badge">S/${cfg?.tarifa || 0}/ud</span>
                </div>
            </div>
            <div class="item-mo">
                <div class="item-mo-amount">${formatCurrency(item.mano_obra)}</div>
                <div class="item-mo-label">M. Obra</div>
            </div>
            <button class="item-delete" onclick="eliminarItem(${item.id})" title="Quitar">
                <span>✕</span>
            </button>
        </div>`;
    }).join('');
}

// ============================================================
// RESUMEN
// ============================================================
function updateResumen() {
    const resumen = document.getElementById('pedido-resumen');
    const totalItems = itemsPedido.reduce((s, i) => s + i.cantidad, 0);
    const totalMO = itemsPedido.reduce((s, i) => s + i.mano_obra, 0);

    if (itemsPedido.length > 0) {
        resumen.style.display = 'block';
        resumen.classList.add('resumen-show');
        document.getElementById('resumen-items').textContent = `${itemsPedido.length} tipo(s) · ${totalItems} und`;
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
        showToast('✅ Pedido guardado y stock descontado!', 'success');
        limpiarFormulario();
        await cargarStock();   // actualizar stock visual
        await cargarPedidos();
        await cargarTandas();  // actualizar contador de pedidos y total MO
        document.getElementById('pedidos').scrollIntoView({ behavior: 'smooth' });

    } catch (err) {
        // Si es 409 = stock insuficiente (backend lo validó también)
        showToast(`❌ ${err.message}`, 'error');
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
    mostrarStockEnFormulario();
}

// ============================================================
// CARGAR PEDIDOS
// ============================================================
async function cargarPedidos(tandaId = null, nombre = null) {
    const container = document.getElementById('pedidos-container');
    const estado = document.getElementById('filtro-estado').value;
    const tituloEl = document.getElementById('titulo-pedidos');

    // Si viene de un clic en el historial, actualizar estado local
    if (tandaId) {
        tandaVisualizadaId = tandaId;
        tandaVisualizadaNombre = nombre;
    } else if (!tandaVisualizadaId && tandaActiva) {
        // Por defecto, ver tanda activa
        tandaVisualizadaId = tandaActiva.id;
        tandaVisualizadaNombre = tandaActiva.nombre;
    }

    // Actualizar título de la sección
    if (tituloEl) {
        tituloEl.textContent = `📋 Pedidos de: ${tandaVisualizadaNombre || 'la Tanda'}`;
    }

    // Gestionar botón de "Volver a Tanda Actual"
    const containerVolver = document.getElementById('container-boton-volver');
    if (containerVolver) {
        if (tandaActiva && tandaVisualizadaId !== tandaActiva.id) {
            containerVolver.innerHTML = `
                <button onclick="irATandaActual()" class="btn btn-sm btn-primary" 
                    style="background:#1e365d; margin-right:8px; font-size:0.75rem; padding: 0.4rem 0.8rem;">
                    🏠 Volver a Tanda Actual
                </button>
            `;
        } else {
            containerVolver.innerHTML = '';
        }
    }

    container.innerHTML = `
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>
        <div class="skeleton-row"></div>`;
    try {
        let url = `/pedidos-herramientas`;
        const params = [];
        if (operadorSesion?.id) params.push(`operador_id=${operadorSesion.id}`);
        if (estado) params.push(`estado=${estado}`);

        // Filtrar por la tanda visualizada
        if (tandaVisualizadaId) {
            params.push(`tanda_id=${tandaVisualizadaId}`);
        }

        if (params.length) url += '?' + params.join('&');
        const pedidos = await fetchAPI(url);
        actualizarStats(pedidos);
        renderPedidos(pedidos);
    } catch (err) {
        container.innerHTML = `
            <div class="error-state">
                <span>⚠️</span><p>No se pudieron cargar los pedidos</p>
                <button class="btn btn-secondary" onclick="cargarPedidos()">🔄 Reintentar</button>
            </div>`;
    }
}

function actualizarStats(pedidos) {
    document.getElementById('count-pendiente').textContent = pedidos.filter(p => p.estado === 'pendiente').length;
    document.getElementById('count-proceso').textContent = pedidos.filter(p => p.estado === 'en_proceso').length;
    document.getElementById('count-completado').textContent = pedidos.filter(p => p.estado === 'completado').length;
}

// ============================================================
// RENDER PEDIDOS
// ============================================================
function renderPedidos(pedidos) {
    const container = document.getElementById('pedidos-container');
    const iconos = { 'Pico': '⛏️', 'Zapapico': '🪓' };

    if (pedidos.length === 0) {
        container.innerHTML = `
            <div class="items-empty" style="padding:2.5rem 1rem;">
                <span>📋</span><p>No hay pedidos aún</p>
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
                        <option value="pendiente"  ${pedido.estado === 'pendiente' ? 'selected' : ''}>⏳ Pendiente</option>
                        <option value="en_proceso" ${pedido.estado === 'en_proceso' ? 'selected' : ''}>🔄 En Proceso</option>
                        <option value="completado" ${pedido.estado === 'completado' ? 'selected' : ''}>✅ Completado</option>
                        <option value="cancelado"  ${pedido.estado === 'cancelado' ? 'selected' : ''}>❌ Cancelado</option>
                    </select>
                    <button class="btn-icon-ver" onclick="verDetalle(${pedido.id})">👁️</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

// ============================================================
// CAMBIAR ESTADO
// ============================================================
async function cambiarEstado(pedidoId, nuevoEstado, selectEl) {
    try {
        await fetchAPI(`/pedidos-herramientas/${pedidoId}/estado`, {
            method: 'PATCH',
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (navigator.vibrate) navigator.vibrate(20);
        showToast(`✅ ${estadoLabel(nuevoEstado)}`, 'success');
        if (selectEl) selectEl.className = `select-estado badge-estado badge-${nuevoEstado}`;
        cargarPedidos();
    } catch (err) {
        showToast(`❌ ${err.message}`, 'error');
        cargarPedidos();
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
    body.innerHTML = `<div style="padding:2rem;text-align:center;"><div class="spinner-lg"></div><p>Cargando...</p></div>`;
    try {
        const pedido = await fetchAPI(`/pedidos-herramientas/${pedidoId}`);
        document.getElementById('modal-pedido-titulo').textContent = `Pedido #${String(pedido.id).padStart(4, '0')}`;
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
                    <div class="detalle-meta-item"><label>Comprador</label><span>👤 ${pedido.comprador_nombre || '—'}</span></div>
                    <div class="detalle-meta-item"><label>Estado</label><span class="badge-estado badge-${pedido.estado}">${estadoLabel(pedido.estado)}</span></div>
                    <div class="detalle-meta-item"><label>Fecha</label><span>${new Date(pedido.created_at).toLocaleString('es-PE')}</span></div>
                </div>
                ${pedido.notas ? `<div class="detalle-nota">📝 ${pedido.notas}</div>` : ''}
                <div class="items-list" style="margin:1rem 0;">${itemsHTML || '<div class="items-empty"><span>📦</span><p>Sin items</p></div>'}</div>
                <div class="pedido-resumen" style="display:block;">
                    <div class="resumen-row resumen-total">
                        <span>Total Mano de Obra</span>
                        <strong>${formatCurrency(pedido.total_mano_obra)}</strong>
                    </div>
                </div>
            </div>`;
    } catch (err) {
        body.innerHTML = `<div style="padding:2rem;text-align:center;color:var(--op-red);">
            ❌ No se pudo cargar el detalle<br>
            <button class="btn btn-secondary" onclick="verDetalle(${pedidoId})" style="margin-top:1rem;">Reintentar</button>
        </div>`;
    }
}

function closePedidoModal() { document.getElementById('modal-detalle').style.display = 'none'; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') closePedidoModal(); });

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
    }, 3200);
}

// ============================================================
// MODAL GESTIÓN DE PAGOS
// ============================================================
let tandaPagosActiva = null;

async function abrirPagosModal(tandaId, tandaNombre, totalMO, totalPagado) {
    tandaPagosActiva = { id: tandaId, mo: totalMO };
    const modal = document.getElementById('modal-pagos');
    modal.style.display = 'flex';

    document.getElementById('modal-pagos-titulo').textContent = 'Pagos: ' + tandaNombre;
    document.getElementById('pagos-total-mo').textContent = formatCurrency(totalMO);

    // Clear form
    document.getElementById('nuevo-pago-monto').value = '';
    document.getElementById('nuevo-pago-notas').value = '';

    await recargarListaPagos();
}

function closePagosModal() {
    document.getElementById('modal-pagos').style.display = 'none';
    tandaPagosActiva = null;
}

async function recargarListaPagos() {
    if (!tandaPagosActiva) return;
    const container = document.getElementById('pagos-lista-container');
    container.innerHTML = '<div style="padding:1rem; text-align:center;"><span class="spinner"></span> Cargando...</div>';

    try {
        const pagos = await fetchAPI(`/operador-pagos/${tandaPagosActiva.id}`);

        // Recalcular pagado y saldo
        const pagadoTotal = pagos.reduce((s, p) => s + Number(p.monto), 0);
        const saldo = Math.max(0, tandaPagosActiva.mo - pagadoTotal);

        document.getElementById('pagos-total-pagado').textContent = formatCurrency(pagadoTotal);
        document.getElementById('pagos-saldo').textContent = formatCurrency(saldo);

        // Render lista
        if (pagos.length === 0) {
            container.innerHTML = '<div class="items-empty" style="padding:2rem 1rem;">No hay pagos registrados aún para esta tanda.</div>';
        } else {
            container.innerHTML = pagos.map(p => {
                const f = new Date(p.fecha).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                return `
                <div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem 1rem; border-bottom:1px solid #f1f5f9; background:white;">
                    <div>
                        <div style="font-weight:600; color:#1a365d; font-size:0.9rem;">${p.metodo_pago || 'Pago Registrado'}</div>
                        <div style="font-size:0.75rem; color:#64748b;">${f} · ${p.notas ? p.notas : ''}</div>
                    </div>
                    <div style="font-weight:700; color:#059669; font-size:1rem;">
                        + ${formatCurrency(p.monto)}
                    </div>
                </div>`;
            }).join('');
        }
    } catch (err) {
        container.innerHTML = `<div style="color:#ef4444; padding:1rem; text-align:center;">Error al cargar pagos: ${err.message}</div>`;
    }
}

async function registrarPago() {
    if (!tandaPagosActiva) return;

    const monto = parseFloat(document.getElementById('nuevo-pago-monto').value);
    const notas = document.getElementById('nuevo-pago-notas').value.trim();

    if (!monto || monto <= 0) {
        showToast('⚠️ Ingresa un monto principal válido', 'error');
        return;
    }

    const btn = document.getElementById('btn-registrar-pago');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Procesando...';

    try {
        await fetchAPI('/operador-pagos', {
            method: 'POST',
            body: JSON.stringify({
                operador_id: operadorSesion.id,
                tanda_id: tandaPagosActiva.id,
                monto: monto,
                metodo_pago: 'Pago/Adelanto',
                notas: notas
            })
        });

        document.getElementById('nuevo-pago-monto').value = '';
        document.getElementById('nuevo-pago-notas').value = '';
        showToast('✅ Pago registrado correctamente', 'success');

        if (navigator.vibrate) navigator.vibrate(30);

        await recargarListaPagos();

        // Disparar update de la tanda principal de fondo para sync
        cargarTandas();

    } catch (err) {
        showToast(`❌ Error: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '✅ Confirmar Pago';
    }
}
function irATandaActual() {
    if (tandaActiva) {
        cargarPedidos(tandaActiva.id, tandaActiva.nombre);
    }
}
