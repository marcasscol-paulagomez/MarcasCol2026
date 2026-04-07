// 1. Cargar productos desde el servidor
async function cargarProductos() {
    try {
        const res = await fetch('/products');
        const productos = await res.json();
        const lista = document.getElementById("catalogo-list");
        if (!lista) return;

        if (productos.length === 0) {
            lista.innerHTML = "<p style='text-align:center;'>Subiendo productos nuevos... ¡Vuelve pronto!</p>";
            return;
        }

        lista.innerHTML = productos.map(p => `
            <div class="catalogo-card">
                <img src="${p.imagen}" alt="${p.titulo}" class="catalogo-img">
                <div class="catalogo-info">
                    <h3 class="catalogo-title">${p.titulo}</h3>
                    <p class="catalogo-price">$${Number(p.precio).toLocaleString()}</p>
                    <button class="catalogo-btn" onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error:", error);
    }
}

// 2. Función para agregar productos
function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    
    const existe = carrito.find(item => item.titulo === titulo);
    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ titulo, precio, imagen, cantidad: 1 });
    }
    
    localStorage.setItem("carrito", JSON.stringify(carrito));
    
    actualizarInterfaz();
    abrirModalCarrito(); // Abrimos el modal para que el usuario vea su compra
}

// 3. Actualizar contador y mini-carrito
function actualizarInterfaz() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const countEl = document.getElementById("cart-count");
    if (countEl) {
        const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        countEl.innerText = `(${total})`;
    }

    // Llenar el mini-carrito (overlay) del index
    const productosContenedor = document.getElementById("carrito-productos");
    if (productosContenedor) {
        if (carrito.length === 0) {
            productosContenedor.innerHTML = "<p>Tu cesta está vacía</p>";
        } else {
            productosContenedor.innerHTML = carrito.map(item => `
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                    <span>${item.titulo} (x${item.cantidad})</span>
                    <strong>$${(item.precio * item.cantidad).toLocaleString()}</strong>
                </div>
            `).join("");
        }
    }
}

// 4. Funciones para el Modal (Overlay)
function abrirModalCarrito() {
    const overlay = document.getElementById("carrito-overlay");
    if (overlay) {
        overlay.style.display = "flex";
        actualizarInterfaz();
    }
}

function cerrarModalCarrito() {
    const overlay = document.getElementById("carrito-overlay");
    if (overlay) overlay.style.display = "none";
}

// Configurar eventos al cargar
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarInterfaz();

    // Configurar botón de cerrar modal
    const btnCerrar = document.getElementById("cerrar-carrito");
    if (btnCerrar) btnCerrar.onclick = cerrarModalCarrito;

    // Configurar clic fuera del modal para cerrar
    const overlay = document.getElementById("carrito-overlay");
    if (overlay) {
        overlay.onclick = (e) => {
            if (e.target === overlay) cerrarModalCarrito();
        };
    }
});
