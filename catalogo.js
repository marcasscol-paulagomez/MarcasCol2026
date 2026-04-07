// Cargar productos al inicio
async function cargarProductos() {
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
            <h3>${p.titulo}</h3>
            <p>$${Number(p.precio).toLocaleString()}</p>
            <button onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">Agregar</button>
        </div>
    `).join("");
}

// Agregar al carrito y abrir el modal "Cesta"
function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const existe = carrito.find(i => i.titulo === titulo);
    
    if (existe) { existe.cantidad++; } 
    else { carrito.push({ titulo, precio, imagen, cantidad: 1 }); }
    
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarInterfaz();
    abrirModalCarrito(); // Esto abre el modal que tienes en tu index.html
}

function actualizarInterfaz() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const count = document.getElementById("cart-count");
    if (count) count.innerText = `(${carrito.reduce((s, i) => s + i.cantidad, 0)})`;
    
    const miniCart = document.getElementById("carrito-productos");
    if (miniCart) {
        miniCart.innerHTML = carrito.map(i => `
            <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                <span>${i.titulo}</span>
                <strong>$${(i.precio * i.cantidad).toLocaleString()}</strong>
            </div>
        `).join("");
    }
}

function abrirModalCarrito() {
    const modal = document.getElementById("carrito-overlay");
    if (modal) modal.style.display = "flex";
}

function cerrarModalCarrito() {
    const modal = document.getElementById("carrito-overlay");
    if (modal) modal.style.display = "none";
}

document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarInterfaz();
    const btnCerrar = document.getElementById("cerrar-carrito");
    if (btnCerrar) btnCerrar.onclick = cerrarModalCarrito;
});
