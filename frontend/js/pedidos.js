// Estado
let pedidos = [];
let productos = [];
let distribuidores = [];
let editingId = null;

// Cargar datos iniciales
async function loadInitialData() {
    try {
        [productos, distribuidores] = await Promise.all([
            getAll('productos'),
            getAll('distribuidores')
        ]);

        populateSelects();
        await loadPedidos();
    } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
    }
}

// Poblar selects de productos y distribuidores
function populateSelects() {
    const productoSelect = document.getElementById('producto_id');
    const distribuidorSelect = document.getElementById('distribuidor_id');

    productoSelect.innerHTML = '<option value="">Seleccione un producto</option>' +
        productos.map(p => `<option value="${p.id}">${p.nombre} - ${p.tipo_producto}</option>`).join('');

    distribuidorSelect.innerHTML = '<option value="">Seleccione un distribuidor</option>' +
        distribuidores.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
}

// Cargar pedidos con filtros opcionales
async function loadPedidos() {
    try {
        const estado = document.getElementById('filter-estado').value;
        let endpoint = '/pedidos';

        if (estado) {
            endpoint += `?estado=${estado}`;
        }

        pedidos = await fetchAPI(endpoint);
        renderPedidos();
    } catch (error) {
        console.error('Error al cargar pedidos:', error);
    }
}

// Renderizar tabla de pedidos
function renderPedidos() {
    const tbody = document.getElementById('pedidos-table-body');

    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No hay pedidos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = pedidos.map(pedido => {
        const estadoBadge =
            pedido.estado === 'completado' ? 'badge-success' :
                pedido.estado === 'pendiente' ? 'badge-warning' : 'badge-danger';

        return `
      <tr>
        <td>${pedido.id}</td>
        <td>${new Date(pedido.fecha_pedido).toLocaleDateString('es-ES')}</td>
        <td>${pedido.producto_nombre || '-'}</td>
        <td>${pedido.distribuidor_nombre || '-'}</td>
        <td>${pedido.cantidad}</td>
        <td>${formatCurrency(pedido.capital_invertido)}</td>
        <td>${formatCurrency(pedido.ganancia_esperada)}</td>
        <td>${formatCurrency(pedido.ganancia_real)}</td>
        <td>${formatCurrency(pedido.devolucion_capital)}</td>
        <td><span class="badge ${estadoBadge}">${pedido.estado}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="editPedido(${pedido.id})">
            ✏️
          </button>
          <button class="btn btn-sm btn-danger" onclick="deletePedido(${pedido.id})">
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

    // Establecer fecha de hoy por defecto
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_pedido').value = today;

    // Establecer valores por defecto
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

// Manejar submit del formulario
document.getElementById('pedido-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        fecha_pedido: document.getElementById('fecha_pedido').value,
        producto_id: parseInt(document.getElementById('producto_id').value),
        distribuidor_id: parseInt(document.getElementById('distribuidor_id').value),
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
