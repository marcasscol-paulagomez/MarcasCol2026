const STORAGE_KEY = "carrito";

async function cargarProductos() {
    const res = await fetch('/products');
    const productos = await res.json();
    const lista = document.getElementById("catalogo-list");
    if (!lista) return;

    lista.innerHTML = productos.map(p => `
        <div class="producto-card">
            <img src="${p.imagen}" width="100%">
            <h3>${p.titulo}</h3>
            <p>$${Number(p.precio).toLocaleString()}</p>
            <button onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">Agregar</button>
        </div>
    `).join("");
}

function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const existe = carrito.find(i => i.titulo === titulo);
    if (existe) { existe.cantidad++; } 
    else { carrito.push({ titulo, precio, imagen, cantidad: 1 }); }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    actualizarInterfaz();
    document.getElementById("carrito-overlay").style.display = "flex";
}

function actualizarInterfaz() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    document.getElementById("cart-count").innerText = `(${carrito.reduce((s, i) => s + i.cantidad, 0)})`;
    
    const pContenedor = document.getElementById("carrito-productos");
    pContenedor.innerHTML = carrito.map(i => `<div>${i.titulo} x${i.cantidad}</div>`).join("");
    
    const total = carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
    document.getElementById("carrito-resumen").innerText = `Total: $${total.toLocaleString()}`;
}

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    document.getElementById("cerrar-carrito").onclick = () => document.getElementById("carrito-overlay").style.display = "none";
    document.getElementById("btn-carrito").onclick = () => document.getElementById("carrito-overlay").style.display = "flex";
    document.getElementById("continuar-compra").onclick = () => window.location.href = 'carrito.html';
});
