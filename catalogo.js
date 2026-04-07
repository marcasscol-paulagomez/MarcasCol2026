async function cargarProductos() {
    try {
        const res = await fetch('/products');
        const productos = await res.json();
        const lista = document.getElementById("catalogo-list");
        if (!lista) return;

        if (productos.length === 0) {
            lista.innerHTML = "<p style='text-align:center;'>No hay productos. Sube uno desde /login</p>";
            return;
        }

        lista.innerHTML = productos.map(p => `
            <div class="catalogo-card">
                <img src="${p.imagen}" class="catalogo-img">
                <div class="catalogo-info">
                    <h3>${p.titulo}</h3>
                    <p class="catalogo-price">$${Number(p.precio).toLocaleString()}</p>
                    <button class="catalogo-btn" onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">Agregar</button>
                </div>
            </div>
        `).join("");
    } catch (e) { console.error("Error cargando productos:", e); }
}

function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const item = carrito.find(i => i.titulo === titulo);
    if (item) { item.cantidad++; } 
    else { carrito.push({ titulo, precio, imagen, cantidad: 1 }); }
    
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarContador();
    
    // Abrir el mini-carrito (overlay) que tienes en el index.html
    const overlay = document.getElementById("carrito-overlay");
    if (overlay) overlay.style.display = "flex";
}

function actualizarContador() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const count = document.getElementById("cart-count");
    if (count) count.innerText = `(${carrito.reduce((s, i) => s + i.cantidad, 0)})`;
}

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarContador();
    const btnCerrar = document.getElementById("cerrar-carrito");
    if (btnCerrar) btnCerrar.onclick = () => document.getElementById("carrito-overlay").style.display = "none";
});
