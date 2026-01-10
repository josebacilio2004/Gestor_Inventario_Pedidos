// Estado
let pedidos = [];
let productos = [];
let distribuidores = [];
let inversionistas = [];
let compradores = [];
let editingId = null;

// Cargar datos iniciales
async function loadInitialData() {
    try {
        [productos, distribuidores, inversionistas, compradores] = await Promise.all([
            getAll('productos'),
            getAll('distribuidores'),
            getAll('inversionistas'),
            getAll('compradores')
        ]);

        populateSelects();
        await loadPedidos();
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        showNotification('Error al cargar datos iniciales', 'error');
    }
}

// Poblar selects
function populateSelects() {
    const productoSelect = document.getElementById('producto_id');
    const distribuidorSelect = document.getElementById('distribuidor_id');
    const inversionistaSelect = document.getElementById('inversionista_id');
    const compradorSelect = document.getElementById('comprador_id');

    productoSelect.innerHTML = '<option value="">Seleccione un producto</option>' +
        productos.map(p => `<option value="${p.id}">${p.nombre} - ${p.tipo_producto}</option>`).join('');

    distribuidorSelect.innerHTML = '<option value="">Seleccione un distribuidor</option>' +
        distribuidores.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');

    inversionistaSelect.innerHTML = '<option value="">Seleccione un inversionista</option>' +
        inversionistas.map(i => `<option value="${i.id}">${i.nombre}</option>`).join('');

    compradorSelect.innerHTML = '<option value="">Seleccione un comprador</option>' +
        compradores.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
}

// Cargar pedidos con filtros opcionales y por ROL
async function loadPedidos() {
    try {
        const estado = document.getElementById('filter-estado').value;
        const userRole = sessionStorage.getItem('userRole');
        const userId = sessionStorage.getItem('userId');

        let endpoint = '/pedidos';

        if (estado) {
            endpoint += `?estado=${estado}`;
        }

        // Obtener todos los pedidos desde el backend
        let allPedidos = await fetchAPI(endpoint);

        // FILTRAR SEGÚN ROL DEL USUARIO
        if (userRole === 'inversionista') {
            // Inversionista solo ve pedidos donde él es el inversionista
            pedidos = allPedidos.filter(p => p.inversionista_id == userId);
            console.log(`Filtrando pedidos para inversionista ${userId}:`, pedidos.length);
        } else if (userRole === 'comprador') {
            // Comprador solo ve pedidos asignados a él
            pedidos = allPedidos.filter(p => p.comprador_id == userId);
            console.log(`Filtrando pedidos para comprador ${userId}:`, pedidos.length);
        } else {
            // Admin ve todos los pedidos sin filtro
            pedidos = allPedidos;
            console.log('Admin ve todos los pedidos:', pedidos.length);
        }

        renderPedidos();
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
    }
}

// Renderizar tabla de pedidos
function renderPedidos() {
    const tbody = document.getElementById('pedidos-table-body');

    if (pedidos.length === 0) {
        const userRole = sessionStorage.getItem('userRole');
        const mensaje = userRole === 'admin'
            ? 'No hay pedidos registrados'
            : 'No tienes pedidos asignados';
        tbody.innerHTML = `<tr><td colspan="12" class="text-center">${mensaje}</td></tr>`;
        return;
    }

    tbody.innerHTML = pedidos.map(pedido => {
        const estadoBadge =
            pedido.estado === 'completado' ? 'badge-success' :
                pedido.estado === 'pendiente' ? 'badge-warning' : 'badge-danger';

        return `
      <tr>
        <td>${pedido.id}</td>
        <td>${formatDate(pedido.fecha_pedido)}</td>
        <td>${pedido.producto_nombre || '-'}</td>
        <td>${pedido.distribuidor_nombre || '-'}</td>
        <td>${pedido.cantidad}</td>
        <td>${formatCurrency(pedido.capital_invertido)}</td>
        <td>${formatCurrency(pedido.ganancia_esperada)}</td>
        <td>${formatCurrency(pedido.ganancia_real)}</td>
        <td>${formatCurrency(pedido.devolucion_capital)}</td>
        <td style="text-align: center;">
          <label class="checkbox-container" title="${pedido.ganancia_devuelta ? 'Ganancia devuelta el ' + formatDate(pedido.fecha_ganancia_devuelta) : 'Ganancia pendiente'}">
            <input type="checkbox" 
                  ${pedido.ganancia_devuelta ? 'checked' : ''} 
                   onchange="toggleGananciaDevuelta(${pedido.id}, this.checked)"
                   class="ganancia-checkbox">
            <span class="checkmark ${pedido.ganancia_devuelta ? 'checked' : ''}"></span>
          </label>
        </td>
        <td><span class="badge ${estadoBadge}">${pedido.estado}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editPedido(${pedido.id})" title="Editar">
            ✏️
          </button>
          <button class="btn btn-sm btn-danger" onclick="deletePedido(${pedido.id})" title="Eliminar">
            🗑️
          </button>
        </td>
      </tr>
    `;
    }).join('');
}

// Resetear filtros
function resetFilters() {
    document.getElementById('filter-estado').value = '';
    loadPedidos();
}

// Abrir modal para crear nuevo pedido
function openCreateModal() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Pedido';
    document.getElementById('pedido-form').reset();
    document.getElementById('pedido-id').value = '';

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_pedido').value = today;
    document.getElementById('ganancia_real').value = '0';
    document.getElementById('devolucion_capital').value = '0';
    document.getElementById('estado').value = 'pendiente';

    openModal('pedido-modal');
}

// Editar pedido
async function editPedido(id) {
    try {
        const pedido = await getById('pedidos', id);
        editingId = id;

        document.getElementById('modal-title').textContent = 'Editar Pedido';
        document.getElementById('pedido-id').value = pedido.id;
        document.getElementById('fecha_pedido').value = formatDateForInput(pedido.fecha_pedido);
        document.getElementById('producto_id').value = pedido.producto_id;
        document.getElementById('distribuidor_id').value = pedido.distribuidor_id;
        document.getElementById('inversionista_id').value = pedido.inversionista_id || '';
        document.getElementById('comprador_id').value = pedido.comprador_id || '';
        document.getElementById('cantidad').value = pedido.cantidad;
        document.getElementById('capital_invertido').value = pedido.capital_invertido;
        document.getElementById('ganancia_esperada').value = pedido.ganancia_esperada;
        document.getElementById('ganancia_real').value = pedido.ganancia_real;
        document.getElementById('devolucion_capital').value = pedido.devolucion_capital;
        document.getElementById('estado').value = pedido.estado;
        document.getElementById('notas').value = pedido.notas || '';

        openModal('pedido-modal');
    } catch (error) {
        console.error('Error al cargar pedido:', error);
    }
}

// Eliminar pedido
async function deletePedido(id) {
    if (!confirm('¿Estás seguro de eliminar este pedido?')) {
        return;
    }

    try {
        await remove('pedidos', id);
        showNotification('Pedido eliminado exitosamente', 'success');
        loadPedidos();
    } catch (error) {
        console.error('Error al eliminar pedido:', error);
    }
}

// Toggle ganancia devuelta - VERSIÓN CORREGIDA (sin reload)
async function toggleGananciaDevuelta(id, checked) {
    try {
        // Actualizar en el backend
        await fetchAPI(`/pedidos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ganancia_devuelta: checked,
                fecha_ganancia_devuelta: checked ? new Date().toISOString().split('T')[0] : null
            })
        });

        // Actualizar el pedido en memoria local
        const pedidoIndex = pedidos.findIndex(p => p.id === id);
        if (pedidoIndex !== -1) {
            pedidos[pedidoIndex].ganancia_devuelta = checked;
            pedidos[pedidoIndex].fecha_ganancia_devuelta = checked ? new Date().toISOString().split('T')[0] : null;
        }

        showNotification(
            checked ? '✅ Ganancia marcada como devuelta' : '⏳ Ganancia pendiente',
            'success'
        );

        // NO recargar para evitar desmarcado
        // loadPedidos(); // REMOVIDO
    } catch (error) {
        console.error('Error al actualizar ganancia:', error);
        showNotification('Error al actualizar', 'error');
        // En caso de error, revertir el checkbox
        const checkbox = document.querySelector(`input[onchange*="toggleGananciaDevuelta(${id}"]`);
        if (checkbox) checkbox.checked = !checked;
    }
}

// Manejar submit del formulario
document.getElementById('pedido-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        fecha_pedido: document.getElementById('fecha_pedido').value,
        producto_id: parseInt(document.getElementById('producto_id').value),
        distribuidor_id: parseInt(document.getElementById('distribuidor_id').value),
        inversionista_id: document.getElementById('inversionista_id').value ? parseInt(document.getElementById('inversionista_id').value) : null,
        comprador_id: document.getElementById('comprador_id').value ? parseInt(document.getElementById('comprador_id').value) : null,
        cantidad: parseInt(document.getElementById('cantidad').value),
        capital_invertido: parseFloat(document.getElementById('capital_invertido').value),
        ganancia_esperada: parseFloat(document.getElementById('ganancia_esperada').value),
        ganancia_real: parseFloat(document.getElementById('ganancia_real').value) || 0,
        devolucion_capital: parseFloat(document.getElementById('devolucion_capital').value) || 0,
        estado: document.getElementById('estado').value,
        notas: document.getElementById('notas').value
    };

    try {
        if (editingId) {
            await update('pedidos', editingId, data);
            showNotification('Pedido actualizado exitosamente', 'success');
        } else {
            await create('pedidos', data);
            showNotification('Pedido creado exitosamente', 'success');
        }

        closeModal('pedido-modal');
        loadPedidos();
    } catch (error) {
        console.error('Error al guardar pedido:', error);
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadInitialData);
