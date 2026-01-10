// Componente de Navegación Dinámica según Rol
function renderNavigation() {
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userLogin = sessionStorage.getItem('userLogin');

    if (!userRole) return '';

    let dashboardLink = '';
    let navLinks = '';

    if (userRole === 'admin') {
        dashboardLink = 'index.html';
        navLinks = `
      <li><a href="index.html" class="nav-link">📊 Dashboard</a></li>
      <li><a href="pages/productos.html" class="nav-link">📦 Productos</a></li>
      <li><a href="pages/distribuidores.html" class="nav-link">🏭 Distribuidores</a></li>
      <li><a href="pages/pedidos.html" class="nav-link">📋 Pedidos</a></li>
      <li><a href="pages/inversionistas.html" class="nav-link">💰 Inversionistas</a></li>
      <li><a href="pages/compradores.html" class="nav-link">🛒 Compradores</a></li>
    `;
    } else if (userRole === 'inversionista') {
        dashboardLink = 'dashboard-inversionista.html';
        navLinks = `
      <li><a href="dashboard-inversionista.html" class="nav-link">🏠 Mi Dashboard</a></li>
      <li><a href="pages/pedidos.html" class="nav-link">📋 Mis Pedidos</a></li>
    `;
    } else if (userRole === 'comprador') {
        dashboardLink = 'dashboard-comprador.html';
        navLinks = `
      <li><a href="dashboard-comprador.html" class="nav-link">🏠 Mi Dashboard</a></li>
      <li><a href="pages/pedidos.html" class="nav-link">📋 Mis Pedidos</a></li>
    `;
    }

    return `
    <nav class="navbar">
      <div class="navbar-container">
        <a href="${dashboardLink}" class="navbar-brand">🏪 Gestor de Inventario</a>
        <ul class="navbar-nav">
          ${navLinks}
          <li style="margin-left: auto;">
            <span class="text-secondary" style="margin-right: 1rem;">👤 ${userName || userLogin}</span>
            <a href="login.html" class="nav-link" style="color: var(--danger);" onclick="sessionStorage.clear()">🚪 Salir</a>
          </li>
        </ul>
      </div>
    </nav>
  `;
}

// Insertar navegación al cargar página
document.addEventListener('DOMContentLoaded', () => {
    const navPlaceholder = document.getElementById('dynamic-nav');
    if (navPlaceholder) {
        navPlaceholder.outerHTML = renderNavigation();
    }
});

// Verificar autenticación
function checkAuth() {
    const userRole = sessionStorage.getItem('userRole');
    const currentPage = window.location.pathname.split('/').pop();

    // Si no hay sesión y no estamos en login, redirigir
    if (!userRole && currentPage !== 'login.html') {
        window.location.href = '/login.html';
        return false;
    }

    return true;
}
