// Landing page functionality - updated with image support

// Load featured products
async function loadFeaturedProducts() {
    try {
        const productos = await fetchAPI('/productos');

        // Get first 4 active products
        const featured = productos.filter(p => p.activo).slice(0, 4);

        const grid = document.getElementById('featured-products-grid');

        if (featured.length === 0) {
            grid.innerHTML = '<p class="text-center text-secondary">No hay productos disponibles actualmente</p>';
            return;
        }

        grid.innerHTML = featured.map(producto => `
            <div class="product-card">
                ${producto.imagen_url
                ? `<img src="${producto.imagen_url}" alt="${producto.nombre}" class="product-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'">
                       <div class="product-image-placeholder" style="display:none;">🔨</div>`
                : `<div class="product-image product-image-placeholder">🔨</div>`
            }
                <h3 class="product-name">${producto.nombre}</h3>
                <p class="product-description">${producto.descripcion || 'Producto de ferretería'}</p>
                <div class="product-price">${formatCurrency(producto.precio_venta)}</div>
                <a href="catalogo.html" class="btn btn-primary">Ver más</a>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error al cargar productos destacados:', error);
        const grid = document.getElementById('featured-products-grid');
        grid.innerHTML = '<p class="text-center text-secondary">Error al cargar productos</p>';
    }
}

// Load on page ready
document.addEventListener('DOMContentLoaded', loadFeaturedProducts);
