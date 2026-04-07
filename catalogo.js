const STORAGE_KEY = "carrito";

async function cargarProductos() {
    try {
        const res = await fetch('/products');
        const productos = await res.json();
        const lista = document.getElementById("catalogo-list");
        if (!lista) return;

        lista.innerHTML = productos.map(p => `
            <div class="catalogo-card">
                <img src="${p.imagen}" class="catalogo-img">
                <div class="catalogo-info">
                    <h3>${p.titulo}</h3>
                    <p>$${Number(p.precio).toLocaleString()}</p>
                    <button onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">Agregar</button>
                </div>
            </div>
        `).join("");
    } catch (e) { console.error("Error:", e); }
}

function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const existe = carrito.find(i => i.titulo === titulo);
    if (existe) { existe.cantidad++; } 
    else { carrito.push({ titulo, precio, imagen, cantidad: 1 }); }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    actualizarContador();
    document.getElementById("carrito-overlay").style.display = "flex";
}

function actualizarContador() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const count = document.getElementById("cart-count");
    if (count) count.innerText = `(${carrito.reduce((s, i) => s + i.cantidad, 0)})`;
}

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarContador();
    document.getElementById("btn-carrito").onclick = () => document.getElementById("carrito-overlay").style.display = "flex";
    document.getElementById("cerrar-carrito").onclick = () => document.getElementById("carrito-overlay").style.display = "none";
    document.getElementById("continuar-compra").onclick = () => window.location.href = 'carrito.html';
});
