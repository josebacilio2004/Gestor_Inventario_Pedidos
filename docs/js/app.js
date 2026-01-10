// Configuración API
// const API_URL = 'http://localhost:3002/api';

// Funciones helper para hacer peticiones
async function fetchAPI(endpoint, options = {}) {
    // Usar API_URL del config.js (producción o desarrollo)
    const url = `${window.API_URL}/api${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al realizar la petición');
        }

        return await response.json();
    } catch (error) {
        console.error('Error en fetchAPI:', error);
        showNotification(error.message, 'error');
        throw error;
    }
}

// Funciones CRUD genéricas
async function getAll(resource) {
    return fetchAPI(`/${resource}`);
}

async function getById(resource, id) {
    return fetchAPI(`/${resource}/${id}`);
}

async function create(resource, data) {
    return fetchAPI(`/${resource}`, {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

async function update(resource, id, data) {
    return fetchAPI(`/${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    });
}

async function remove(resource, id) {
    return fetchAPI(`/${resource}/${id}`, {
        method: 'DELETE'
    });
}

// Sistema de notificaciones
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" class="close-btn">×</button>
  `;

    // Estilos inline para notificaciones
    notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    z-index: 3000;
    display: flex;
    align-items: center;
    gap: 1rem;
    animation: slideInRight 0.3s ease;
  `;

    document.body.appendChild(notification);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN'
    }).format(amount);
}

// Formatear fecha
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Formatear fecha para input
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Cargar estadísticas en el dashboard
async function loadDashboardStats() {
    try {
        const stats = await fetchAPI('/pedidos/stats');

        document.getElementById('total-pedidos').textContent = stats.total_pedidos || 0;
        document.getElementById('capital-total').textContent = formatCurrency(stats.capital_total || 0);
        document.getElementById('ganancia-esperada').textContent = formatCurrency(stats.ganancia_esperada_total || 0);
        document.getElementById('ganancia-real').textContent = formatCurrency(stats.ganancia_real_total || 0);
        document.getElementById('devolucion-total').textContent = formatCurrency(stats.devolucion_total || 0);
        document.getElementById('margen-ganancia').textContent = `${stats.margen_ganancia || 0}%`;
        document.getElementById('pedidos-completados').textContent = stats.pedidos_completados || 0;
        document.getElementById('pedidos-pendientes').textContent = stats.pedidos_pendientes || 0;
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
    }
}

// Marcar link activo en navegación
function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Modal helper
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

// Cerrar modal al hacer clic fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    setActiveNavLink();

    // Si estamos en el dashboard, cargar estadísticas
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
        loadDashboardStats();
        // Actualizar cada 30 segundos
        setInterval(loadDashboardStats, 30000);
    }
});

// Añadir estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
