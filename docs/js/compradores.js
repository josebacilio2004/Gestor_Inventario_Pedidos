// Estado
let compradores = [];
let editingId = null;

// Cargar compradores al iniciar
async function loadCompradores() {
    try {
        compradores = await getAll('compradores');
        renderCompradores();
    } catch (error) {
        console.error('Error al cargar compradores:', error);
    }
}

// Renderizar tabla de compradores
function renderCompradores() {
    const tbody = document.getElementById('compradores-table-body');

    if (compradores.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay compradores registrados</td></tr>';
        return;
    }

    tbody.innerHTML = compradores.map(comp => `
    <tr>
      <td>${comp.id}</td>
      <td><strong>${comp.nombre}</strong></td>
      <td>${comp.usuario || '-'}</td>
      <td>${comp.total_pedidos || 0}</td>
      <td>${formatCurrency(comp.capital_total_gestionado || 0)}</td>
      <td style="color: var(--success)">${formatCurrency(comp.capital_devuelto || 0)}</td>
      <td style="color: var(--warning)">${formatCurrency(comp.capital_pendiente_devolver || 0)}</td>
      <td>${formatCurrency(comp.ganancia_generada || 0)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editComprador(${comp.id})" title="Editar">
          ✏️
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteComprador(${comp.id})" title="Eliminar">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

// Abrir modal para crear nuevo comprador
function openCreateModal() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Comprador Principal';
    document.getElementById('comprador-form').reset();
    document.getElementById('comprador-id').value = '';
    document.getElementById('password').placeholder = 'Contraseña para acceso';
    openModal('comprador-modal');
}

// Editar comprador
async function editComprador(id) {
    try {
        const comp = await getById('compradores', id);
        editingId = id;

        document.getElementById('modal-title').textContent = 'Editar Comprador';
        document.getElementById('comprador-id').value = comp.id;
        document.getElementById('nombre').value = comp.nombre;
        document.getElementById('usuario').value = comp.usuario || '';
        document.getElementById('password').value = '';
        document.getElementById('password').placeholder = 'Dejar vacío para mantener la actual';
        document.getElementById('contacto').value = comp.contacto || '';
        document.getElementById('telefono').value = comp.telefono || '';
        document.getElementById('email').value = comp.email || '';
        document.getElementById('notas').value = comp.notas || '';

        openModal('comprador-modal');
    } catch (error) {
        console.error('Error al cargar comprador:', error);
    }
}

// Eliminar comprador
async function deleteComprador(id) {
    if (!confirm('¿Estás seguro de eliminar este comprador?\nNOTA: No se puede eliminar si tiene pedidos asociados.')) {
        return;
    }

    try {
        await remove('compradores', id);
        showNotification('Comprador eliminado exitosamente', 'success');
        loadCompradores();
    } catch (error) {
        console.error('Error al eliminar comprador:', error);
    }
}

// Manejar submit del formulario
document.getElementById('comprador-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        nombre: document.getElementById('nombre').value,
        usuario: document.getElementById('usuario').value,
        contacto: document.getElementById('contacto').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        notas: document.getElementById('notas').value
    };

    // Agregar password solo si se ingresó
    const password = document.getElementById('password').value;
    if (password) {
        data.password_hash = password; // En producción esto debe ser hasheado
    }

    try {
        if (editingId) {
            await update('compradores', editingId, data);
            showNotification('Comprador actualizado exitosamente', 'success');
        } else {
            await create('compradores', data);
            showNotification('Comprador creado exitosamente', 'success');
        }

        closeModal('comprador-modal');
        loadCompradores();
    } catch (error) {
        console.error('Error al guardar comprador:', error);
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadCompradores);
