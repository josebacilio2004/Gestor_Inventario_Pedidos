// Estado
let inversionistas = [];
let editingId = null;

// Cargar inversionistas al iniciar
async function loadInversionistas() {
    try {
        inversionistas = await getAll('inversionistas');
        renderInversionistas();
    } catch (error) {
        console.error('Error al cargar inversionistas:', error);
    }
}

// Renderizar tabla de inversionistas
function renderInversionistas() {
    const tbody = document.getElementById('inversionistas-table-body');

    if (inversionistas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay inversionistas registrados</td></tr>';
        return;
    }

    tbody.innerHTML = inversionistas.map(inv => `
    <tr>
      <td>${inv.id}</td>
      <td><strong>${inv.nombre}</strong></td>
      <td>${inv.usuario || '-'}</td>
      <td>${inv.total_pedidos || 0}</td>
      <td>${formatCurrency(inv.capital_total_invertido || 0)}</td>
      <td style="color: var(--success)">${formatCurrency(inv.capital_total_devuelto || 0)}</td>
      <td style="color: var(--warning)">${formatCurrency(inv.capital_total_pendiente || 0)}</td>
      <td>${formatCurrency(inv.ganancia_total_real || 0)}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="verDetalle(${inv.id})" title="Ver detalle">
          👁️
        </button>
        <button class="btn btn-sm btn-secondary" onclick="editInversionista(${inv.id})" title="Editar">
          ✏️
        </button>
        <button class="btn btn-sm btn-danger" onclick="deleteInversionista(${inv.id})" title="Eliminar">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

// Ver detalle del inversionista
async function verDetalle(id) {
    try {
        const data = await getById('inversionistas', id);

        document.getElementById('detalle-nombre').textContent = `Inversionista: ${data.nombre}`;
        document.getElementById('detalle-capital-invertido').textContent = formatCurrency(data.resumen.capital_total_invertido || 0);
        document.getElementById('detalle-capital-devuelto').textContent = formatCurrency(data.resumen.capital_total_devuelto || 0);
        document.getElementById('detalle-capital-pendiente').textContent = formatCurrency(data.resumen.capital_total_pendiente || 0);

        const pedidosBody = document.getElementById('detalle-pedidos-body');
        if (!data.pedidos || data.pedidos.length === 0) {
            pedidosBody.innerHTML = '<tr><td colspan="7" class="text-center">No hay pedidos asociados</td></tr>';
        } else {
            pedidosBody.innerHTML = data.pedidos.map(p => `
        <tr>
          <td>${p.id}</td>
          <td>${p.producto_nombre || '-'}</td>
          <td>${p.comprador_nombre || '-'}</td>
          <td>${formatCurrency(p.capital_invertido)}</td>
          <td style="color: var(--success)">${formatCurrency(p.capital_devuelto)}</td>
          <td style="color: var(--warning)">${formatCurrency(p.capital_pendiente)}</td>
          <td><span class="badge ${p.estado === 'completado' ? 'badge-success' : (p.estado === 'pendiente' ? 'badge-warning' : 'badge-danger')}">${p.estado}</span></td>
        </tr>
      `).join('');
        }

        openModal('detalle-modal');
    } catch (error) {
        console.error('Error al cargar detalle:', error);
    }
}

// Abrir modal para crear nuevo inversionista
function openCreateModal() {
    editingId = null;
    document.getElementById('modal-title').textContent = 'Nuevo Inversionista';
    document.getElementById('inversionista-form').reset();
    document.getElementById('inversionista-id').value = '';
    document.getElementById('password').placeholder = 'Contraseña para acceso';
    openModal('inversionista-modal');
}

// Editar inversionista
async function editInversionista(id) {
    try {
        const inv = await getById('inversionistas', id);
        editingId = id;

        document.getElementById('modal-title').textContent = 'Editar Inversionista';
        document.getElementById('inversionista-id').value = inv.id;
        document.getElementById('nombre').value = inv.nombre;
        document.getElementById('usuario').value = inv.usuario || '';
        document.getElementById('password').value = '';
        document.getElementById('password').placeholder = 'Dejar vacío para mantener la actual';
        document.getElementById('contacto').value = inv.contacto || '';
        document.getElementById('telefono').value = inv.telefono || '';
        document.getElementById('email').value = inv.email || '';
        document.getElementById('notas').value = inv.notas || '';

        openModal('inversionista-modal');
    } catch (error) {
        console.error('Error al cargar inversionista:', error);
    }
}

// Eliminar inversionista
async function deleteInversionista(id) {
    if (!confirm('¿Estás seguro de eliminar este inversionista?\nNOTA: No se puede eliminar si tiene pedidos asociados.')) {
        return;
    }

    try {
        await remove('inversionistas', id);
        showNotification('Inversionista eliminado exitosamente', 'success');
        loadInversionistas();
    } catch (error) {
        console.error('Error al eliminar inversionista:', error);
    }
}

// Manejar submit del formulario
document.getElementById('inversionista-form').addEventListener('submit', async (e) => {
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
            await update('inversionistas', editingId, data);
            showNotification('Inversionista actualizado exitosamente', 'success');
        } else {
            await create('inversionistas', data);
            showNotification('Inversionista creado exitosamente', 'success');
        }

        closeModal('inversionista-modal');
        loadInversionistas();
    } catch (error) {
        console.error('Error al guardar inversionista:', error);
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', loadInversionistas);
