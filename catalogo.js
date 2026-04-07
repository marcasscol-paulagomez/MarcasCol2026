let productosBase = [];

async function cargarProductos() {
    // Nota: Como no usamos Railway, aquí puedes usar un archivo productos.json 
    // o el endpoint de tu servidor si lo mantienes activo.
    try {
        const res = await fetch('/products'); 
        productosBase = await res.json();
        renderizar(productosBase);
    } catch (e) {
        console.error("Error al cargar productos", e);
    }
}

function renderizar(lista) {
    const contenedor = document.getElementById("catalogo-list");
    if (!contenedor) return;
    
    contenedor.innerHTML = lista.map(p => `
        <div class="producto-card">
            <img src="${p.imagen}" alt="${p.titulo}">
            <h3>${p.titulo}</h3>
            <p>$${Number(p.precio).toLocaleString()}</p>
            <button onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">Agregar al Carrito</button>
        </div>
    `).join("");
}

// BUSCADOR EN VIVO
document.getElementById("search-input").addEventListener("input", (e) => {
    const termino = e.target.value.toLowerCase();
    const filtrados = productosBase.filter(p => 
        p.titulo.toLowerCase().includes(termino)
    );
    renderizar(filtrados);
});

function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const item = carrito.find(i => i.titulo === titulo);
    if (item) {
        item.cantidad++;
    } else {
        carrito.push({ titulo, precio, imagen, cantidad: 1 });
    }
    localStorage.setItem("carrito", JSON.stringify(carrito));
    actualizarContador();
    alert("Producto agregado");
}

function actualizarContador() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const total = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    document.getElementById("cart-count").innerText = `(${total})`;
}

document.addEventListener("DOMContentLoaded", cargarProductos);
