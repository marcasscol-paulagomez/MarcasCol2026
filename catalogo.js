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

        lista.innerHTML = productos.map(p => `
            <div class="catalogo-card">
                <img src="${p.imagen}" class="catalogo-img">
                <h3>${p.titulo}</h3>
                <p>$${Number(p.precio).toLocaleString()}</p>
                <button onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">Agregar</button>
            </div>
        `).join("");
    } catch (e) { console.error(e); }
}

function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    carrito.push({ titulo, precio, imagen, cantidad: 1 });
    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert("¡Producto añadido!");
}

document.addEventListener("DOMContentLoaded", cargarProductos);
