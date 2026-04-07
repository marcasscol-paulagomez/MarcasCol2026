const STORAGE_KEY = "carrito";

function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // Verificamos si el producto ya existe para sumar cantidad
    const existe = carrito.find(i => i.titulo === titulo);
    if (existe) {
        existe.cantidad++;
    } else {
        // GUARDAMOS CON ESTOS NOMBRES EXACTOS: titulo, precio, imagen, cantidad
        carrito.push({ titulo, precio, imagen, cantidad: 1 });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    
    // Actualizar el numerito del carrito (0)
    const countEl = document.getElementById("cart-count");
    if (countEl) countEl.innerText = `(${carrito.reduce((s, i) => s + i.cantidad, 0)})`;

    // Abrir el modal de la cesta
    document.getElementById("carrito-overlay").style.display = "flex";
    actualizarMiniCarrito();
}

// Función para que el modal del index también muestre los productos
function actualizarMiniCarrito() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const contenedor = document.getElementById("carrito-productos");
    if (contenedor) {
        contenedor.innerHTML = carrito.map(i => `
            <div style="border-bottom:1px solid #eee; padding:5px 0;">
                ${i.titulo} x${i.cantidad} - <strong>$${(i.precio * i.cantidad).toLocaleString()}</strong>
            </div>
        `).join("");
    }
}
