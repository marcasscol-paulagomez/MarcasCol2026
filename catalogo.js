let productosBase = []; // Aquí guardaremos los productos para buscarlos

async function cargarProductos() {
    const res = await fetch('/products');
    productosBase = await res.json();
    renderizar(productosBase);
}

function renderizar(lista) {
    const contenedor = document.getElementById("catalogo-list");
    if (!contenedor) return;
    
    if (lista.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center;'>No se encontraron productos.</p>";
        return;
    }

    contenedor.innerHTML = lista.map(p => `
        <div class="catalogo-card">
            <img src="${p.imagen}" class="catalogo-img">
            <h3>${p.titulo}</h3>
            <p>$${Number(p.precio).toLocaleString()}</p>
            <button onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">Agregar</button>
        </div>
    `).join("");
}

// --- LÓGICA DEL BUSCADOR ---
document.getElementById("search-input").addEventListener("input", (e) => {
    const busqueda = e.target.value.toLowerCase();
    const filtrados = productosBase.filter(p => 
        p.titulo.toLowerCase().includes(busqueda) || 
        p.descripcion.toLowerCase().includes(busqueda)
    );
    renderizar(filtrados);
});

function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const item = carrito.find(i => i.titulo === titulo);
    if (item) { item.cantidad++; } 
    else { carrito.push({ titulo, precio, imagen, cantidad: 1 }); }
    localStorage.setItem("carrito", JSON.stringify(carrito));
    
    // Actualizar contador visual
    const count = document.getElementById("cart-count");
    if (count) count.innerText = `(${carrito.reduce((s, i) => s + i.cantidad, 0)})`;
    
    // Abrir modal de cesta si existe
    const overlay = document.getElementById("carrito-overlay");
    if (overlay) overlay.style.display = "flex";
}

document.addEventListener("DOMContentLoaded", cargarProductos);
