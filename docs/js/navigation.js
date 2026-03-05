// Componente de Navegación Dinámica según Rol
function renderNavigation() {
  const userRole = sessionStorage.getItem('userRole');
  const userName = sessionStorage.getItem('userName');
  const userLogin = sessionStorage.getItem('userLogin');

  if (!userRole) return '';

  const isInPages = window.location.pathname.includes('/pages/');
  const rootPath = isInPages ? '../' : '';
  const pagesPath = isInPages ? '' : 'pages/';

  let dashboardLink = '';
  let navLinks = '';

  if (userRole === 'admin') {
    dashboardLink = rootPath + 'index.html';
    navLinks = `
      <li><a href="${rootPath}index.html" class="nav-link">📊 Dashboard</a></li>
      <li><a href="${pagesPath}productos.html" class="nav-link">📦 Productos</a></li>
      <li><a href="${pagesPath}distribuidores.html" class="nav-link">🏭 Distribuidores</a></li>
      <li><a href="${pagesPath}pedidos.html" class="nav-link">📋 Pedidos</a></li>
      <li><a href="${pagesPath}inversionistas.html" class="nav-link">💰 Inversionistas</a></li>
      <li><a href="${pagesPath}compradores.html" class="nav-link">🛒 Compradores</a></li>
    `;
  } else if (userRole === 'inversionista') {
    dashboardLink = rootPath + 'dashboard-inversionista.html';
    navLinks = `
      <li><a href="${rootPath}dashboard-inversionista.html" class="nav-link">🏠 Mi Dashboard</a></li>
      <li><a href="${pagesPath}pedidos.html" class="nav-link">📋 Mis Pedidos</a></li>
    `;
  } else if (userRole === 'comprador') {
    dashboardLink = rootPath + 'dashboard-comprador.html';
    navLinks = `
      <li><a href="${rootPath}dashboard-comprador.html" class="nav-link">🏠 Mi Dashboard</a></li>
      <li><a href="${pagesPath}pedidos.html" class="nav-link">📋 Mis Pedidos</a></li>
      <li><a href="${pagesPath}ventas-mayoristas.html" class="nav-link">📦 Ventas Mayoristas</a></li>
    `;
  }

  return `
    <nav class="navbar">
      <div class="navbar-container">
        <a href="${dashboardLink}" class="navbar-brand">🏪 Gestor de Inventario</a>
        <ul class="navbar-nav">
          ${navLinks}
          <li style="margin-left: auto;">
            <span style="color: #ffffff; font-weight: 600; margin-right: 1rem;">👤 ${userName || userLogin}</span>
            <a href="${rootPath}login.html" class="nav-link" style="color: var(--danger);" onclick="sessionStorage.clear(); localStorage.clear();">🚪 Salir</a>
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
