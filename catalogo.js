// Función para cargar los productos desde el servidor
async function cargarProductos() {
    try {
        const res = await fetch('/products');
        const productos = await res.json();
        const lista = document.getElementById("catalogo-list");
        
        if (!lista) return;

        if (productos.length === 0) {
            lista.innerHTML = "<p style='text-align:center;'>No hay productos. Sube uno desde el panel.</p>";
            return;
        }

        // Aquí dibujamos cada producto con su botón de agregar
        lista.innerHTML = productos.map(p => `
            <div class="catalogo-card">
                <img src="${p.imagen}" class="catalogo-img" alt="${p.titulo}">
                <div class="catalogo-info">
                    <h3 class="catalogo-title">${p.titulo}</h3>
                    <p class="catalogo-price">$${Number(p.precio).toLocaleString()}</p>
                    <button class="catalogo-btn" onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        `).join("");
    } catch (e) {
        console.error("Error cargando productos:", e);
    }
}

// ESTA ES LA FUNCIÓN QUE DEBE EXISTIR PARA QUE EL BOTÓN FUNCIONE
function agregarAlCarrito(titulo, precio, imagen) {
    // 1. Obtener lo que ya hay en el carrito o crear uno vacío
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    
    // 2. Revisar si el producto ya está para sumarlo o agregarlo nuevo
    const existe = carrito.find(item => item.titulo === titulo);
    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ titulo, precio, imagen, cantidad: 1 });
    }
    
    // 3. Guardar de nuevo en la memoria del navegador
    localStorage.setItem("carrito", JSON.stringify(carrito));
    
    // 4. Actualizar el contador visual si existe
    actualizarContadorCarrito();
    
    alert("✅ " + titulo + " se agregó al carrito");
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const contador = document.getElementById("cart-count");
    if (contador) {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        contador.innerText = `(${totalItems})`;
    }
}

// Iniciar cuando la página cargue
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarContadorCarrito();
});
