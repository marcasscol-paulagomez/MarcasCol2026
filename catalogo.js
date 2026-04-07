const STORAGE_KEY = "carrito";
const LLAVE_TEST = "pub_test_Q5yS9J9ps9as03XpI89m266C7Uo6874e";

// 1. Cargar productos desde el servidor
async function cargarProductos() {
    try {
        const res = await fetch('/products');
        const productos = await res.json();
        const lista = document.getElementById("catalogo-list");
        if (!lista) return;

        lista.innerHTML = productos.map(p => `
            <div class="producto-card" style="border:1px solid #eee; padding:10px; border-radius:10px; text-align:center;">
                <img src="${p.imagen}" style="width:100%; border-radius:5px;">
                <h3>${p.titulo}</h3>
                <p style="font-weight:bold; color:green;">$${Number(p.precio).toLocaleString()}</p>
                <button onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')" style="cursor:pointer; background:black; color:white; border:none; padding:10px; width:100%; border-radius:5px;">
                    Agregar al Carrito
                </button>
            </div>
        `).join("");
    } catch (e) {
        console.error("Error cargando productos:", e);
    }
}

// 2. Lógica para agregar productos
function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const existe = carrito.find(i => i.titulo === titulo);

    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ titulo, precio, imagen, cantidad: 1 });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    actualizarInterfaz();
    
    // Mostrar el modal automáticamente
    document.getElementById("carrito-overlay").style.display = "flex";
}

// 3. Actualizar la lista visual de la cesta
function actualizarInterfaz() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // Número del botón carrito (0)
    const countEl = document.getElementById("cart-count");
    if (countEl) {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        countEl.innerText = `(${totalItems})`;
    }

    const contenedor = document.getElementById("carrito-productos");
    const resumen = document.getElementById("carrito-resumen");
    
    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = "<p>Tu cesta está vacía</p>";
        if (resumen) resumen.innerText = "Total: $0";
        return;
    }

    let totalDinero = 0;
    contenedor.innerHTML = carrito.map((p, index) => {
        const sub = p.precio * p.cantidad;
        totalDinero += sub;
        return `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.9rem; border-bottom:1px solid #eee; padding-bottom:5px;">
                <span>${p.titulo} x ${p.cantidad}</span>
                <span>$${sub.toLocaleString()}</span>
            </div>
        `;
    }).join("");

    if (resumen) resumen.innerHTML = `<strong>Total: $${totalDinero.toLocaleString()}</strong>`;
}

// 4. FUNCIÓN DE PAGO DIRECTA (Aquí estaba el error)
function pagarWompi() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (carrito.length === 0) return alert("Agrega algo al carrito primero");

    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    
    const montoCentavos = Math.floor(total * 100);
    const referencia = "TEST-" + Date.now();

    // Redirección a la pasarela de pruebas
    window.location.href = `https://checkout.wompi.co/p/?public-key=${LLAVE_TEST}&currency=COP&amount-in-cents=${montoCentavos}&reference=${referencia}`;
}

// 5. EVENTOS
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarInterfaz();

    // Abrir/Cerrar
    document.getElementById("btn-carrito").onclick = () => document.getElementById("carrito-overlay").style.display = "flex";
    document.getElementById("cerrar-carrito").onclick = () => document.getElementById("carrito-overlay").style.display = "none";
    
    // BOTÓN CONTINUAR: Ahora ejecuta el pago, no cambia de página
    document.getElementById("continuar-compra").onclick = pagarWompi;
});
