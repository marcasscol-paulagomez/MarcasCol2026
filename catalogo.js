async function cargarProductos() {
    const res = await fetch('/products');
    const productos = await res.json();
    const lista = document.getElementById("catalogo-list");
    if (!lista || productos.length === 0) return;

    lista.innerHTML = productos.map(p => `
        <div class="catalogo-card">
            <img src="${p.imagen}" class="catalogo-img">
            <h3>${p.titulo}</h3>
            <p>$${Number(p.precio).toLocaleString()}</p>
            <button onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">Agregar</button>
        </div>
    `).join("");
}

function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const item = carrito.find(i => i.titulo === titulo);
    if (item) { item.cantidad++; } 
    else { carrito.push({ titulo, precio, imagen, cantidad: 1 }); }
    
    localStorage.setItem("carrito", JSON.stringify(carrito));
    
    actualizarContador();
    abrirCesta(); // Muestra el modal de confirmación
}

function actualizarContador() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    document.getElementById("cart-count").innerText = `(${total})`;
}

function abrirCesta() {
    const overlay = document.getElementById("carrito-overlay");
    if (overlay) overlay.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarContador();
    
    // Cerrar el modal de la cesta
    const btnCerrar = document.getElementById("cerrar-carrito");
    if (btnCerrar) {
        btnCerrar.onclick = () => document.getElementById("carrito-overlay").style.display = "none";
    }
});
