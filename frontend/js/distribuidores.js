// Estado
let distribuidores = [];
let editingId = null;

// Cargar distribuidores al iniciar
async function loadDistribuidores() {
    try {
        distribuidores = await getAll('distribuidores');
        renderDistribuidores();
    } catch (error) {
        console.error('Error al cargar distribuidores:', error);
    }
}

// Renderizar tabla de distribuidores
function renderDistribuidores() {
    const tbody = document.getElementById('distribuidores-table-body');

    if (distribuidores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay distribuidores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = distribuidores.map(dist => `
    <tr>
      <td>${dist.id}</td>
      <td><strong>${dist.nombre}</strong></td>
      <td>${dist.contacto || '-'}</td>
      <td>${dist.telefono || '-'}</td>
      <td>${dist.email || '-'}</td>
      <td>${dist.direccion || '-'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editDistribuidor(${dist.id})">
          ✏️ Editar
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteDistribuidor(${dist.id})">
          🗑️ Eliminar
        </button>
      </td>
    </tr>
  `).join('');
}

// Abrir modal para crear nuevo distribuidor
function openCreateModal() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Distribuidor';
    document.getElementById('distribuidor-form').reset();
    document.getElementById('distribuidor-id').value = '';
    openModal('distribuidor-modal');
}

// Editar distribuidor
async function editDistribuidor(id) {
    try {
        const dist = await getById('distribuidores', id);
        editingId = id;

        document.getElementById('modal-title').textContent = 'Editar Distribuidor';
        document.getElementById('distribuidor-id').value = dist.id;
        document.getElementById('nombre').value = dist.nombre;
        document.getElementById('contacto').value = dist.contacto || '';
        document.getElementById('telefono').value = dist.telefono || '';
        document.getElementById('email').value = dist.email || '';
        document.getElementById('direccion').value = dist.direccion || '';

        openModal('distribuidor-modal');
    } catch (error) {
        console.error('Error al cargar distribuidor:', error);
    }
}

// Eliminar distribuidor
async function deleteDistribuidor(id) {
    if (!confirm('¿Estás seguro de eliminar este distribuidor?')) {
        return;
    }

    try {
        await remove('distribuidores', id);
        showNotification('Distribuidor eliminado exitosamente', 'success');
        loadDistribuidores();
    } catch (error) {
        console.error('Error al eliminar distribuidor:', error);
    }
}

// Manejar submit del formulario
document.getElementById('distribuidor-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        nombre: document.getElementById('nombre').value,
        contacto: document.getElementById('contacto').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        direccion: document.getElementById('direccion').value
    };

    try {
        if (editingId) {
            await update('distribuidores', editingId, data);
            showNotification('Distribuidor actualizado exitosamente', 'success');
        } else {
            await create('distribuidores', data);
            showNotification('Distribuidor creado exitosamente', 'success');
        }

        closeModal('distribuidor-modal');
        loadDistribuidores();
    } catch (error) {
        console.error('Error al guardar distribuidor:', error);
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadDistribuidores);
