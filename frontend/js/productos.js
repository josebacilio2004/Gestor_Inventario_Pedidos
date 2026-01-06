// Estado
let productos = [];
let editingId = null;

// Cargar productos al iniciar
async function loadProductos() {
    try {
        productos = await getAll('productos');
        renderProductos();
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Renderizar tabla de productos
function renderProductos() {
    const tbody = document.getElementById('productos-table-body');

    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay productos registrados</td></tr>';
        return;
    }

    tbody.innerHTML = productos.map(producto => `
    <tr>
      <td>${producto.id}</td>
      <td><strong>${producto.nombre}</strong></td>
      <td><span class="badge badge-success">${producto.tipo_producto}</span></td>
      <td>${producto.precio_referencia ? formatCurrency(producto.precio_referencia) : '-'}</td>
      <td>${producto.descripcion || '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editProducto(${producto.id})">
          ✏️ Editar
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteProducto(${producto.id})">
          🗑️ Eliminar
        </button>
      </td>
    </tr>
  `).join('');
}

// Abrir modal para crear nuevo producto
function openCreateModal() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Producto';
    document.getElementById('producto-form').reset();
    document.getElementById('producto-id').value = '';
    openModal('producto-modal');
}

// Editar producto
async function editProducto(id) {
    try {
        const producto = await getById('productos', id);
        editingId = id;

        document.getElementById('modal-title').textContent = 'Editar Producto';
        document.getElementById('producto-id').value = producto.id;
        document.getElementById('nombre').value = producto.nombre;
        document.getElementById('tipo_producto').value = producto.tipo_producto;
        document.getElementById('precio_referencia').value = producto.precio_referencia || '';
        document.getElementById('descripcion').value = producto.descripcion || '';

        openModal('producto-modal');
    } catch (error) {
        console.error('Error al cargar producto:', error);
    }
}

// Eliminar producto
async function deleteProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) {
        return;
    }

    try {
        await remove('productos', id);
        showNotification('Producto eliminado exitosamente', 'success');
        loadProductos();
    } catch (error) {
        console.error('Error al eliminar producto:', error);
    }
}

// Manejar submit del formulario
document.getElementById('producto-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        nombre: document.getElementById('nombre').value,
        tipo_producto: document.getElementById('tipo_producto').value,
        precio_referencia: parseFloat(document.getElementById('precio_referencia').value) || null,
        descripcion: document.getElementById('descripcion').value
    };

    try {
        if (editingId) {
            await update('productos', editingId, data);
            showNotification('Producto actualizado exitosamente', 'success');
        } else {
            await create('productos', data);
            showNotification('Producto creado exitosamente', 'success');
        }

        closeModal('producto-modal');
        loadProductos();
    } catch (error) {
        console.error('Error al guardar producto:', error);
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadProductos);
