// Estado
let productos = [];
let distribuidores = [];
let editingId = null;

// Cargar productos al iniciar
async function loadProductos() {
    try {
        [productos, distribuidores] = await Promise.all([
            getAll('productos'),
            getAll('distribuidores')
        ]);
        populateDistribuidoresSelect();
        renderProductos();
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Poblar select de distribuidores
function populateDistribuidoresSelect() {
    const select = document.getElementById('distribuidor_id');
    if (select) {
        select.innerHTML = '<option value="">Ninguno</option>' +
            distribuidores.map(d => `<option value="${d.id}">${d.nombre}</option>`).join('');
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
      <td>${producto.distribuidor_nombre || '-'}</td>
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
        document.getElementById('distribuidor_id').value = producto.distribuidor_id || '';
        document.getElementById('precio_referencia').value = producto.precio_referencia || '';
        document.getElementById('descripcion').value = producto.descripcion || '';
        document.getElementById('imagen_url').value = producto.imagen_url || '';

        // Mostrar preview si hay imagen
        if (producto.imagen_url) {
            const preview = document.getElementById('image-preview');
            const container = document.getElementById('image-preview-container');
            preview.src = producto.imagen_url;
            container.style.display = 'block';
        }

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
        distribuidor_id: document.getElementById('distribuidor_id').value || null,
        precio_referencia: parseFloat(document.getElementById('precio_referencia').value) || null,
        descripcion: document.getElementById('descripcion').value,
        imagen_url: document.getElementById('imagen_url').value || null
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
document.addEventListener('DOMContentLoaded', () => {
    loadProductos();

    // Preview de imagen
    const imagenUrlInput = document.getElementById('imagen_url');
    if (imagenUrlInput) {
        imagenUrlInput.addEventListener('input', (e) => {
            const url = e.target.value;
            const preview = document.getElementById('image-preview');
            const container = document.getElementById('image-preview-container');

            if (url) {
                preview.src = url;
                container.style.display = 'block';
                preview.onerror = () => {
                    container.style.display = 'none';
                };
            } else {
                container.style.display = 'none';
            }
        });
    }
});
