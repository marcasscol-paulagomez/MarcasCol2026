// CONFIGURACIÓN DE LLAVES Y RUTAS
const STORAGE_KEY = "carrito";
const LLAVE_TEST = "pub_test_Q5yS9J9ps9as03XpI89m266C7Uo6874e";

// 1. CARGAR PRODUCTOS DESDE EL SERVIDOR
async function cargarProductos() {
    try {
        const res = await fetch('/products');
        const productos = await res.json();
        const lista = document.getElementById("catalogo-list");
        
        if (!lista) return;

        if (productos.length === 0) {
            lista.innerHTML = "<p style='text-align:center; padding:20px;'>No hay productos aún. Sube uno desde el panel de control.</p>";
            return;
        }

        lista.innerHTML = productos.map(p => `
            <div class="catalogo-card">
                <img src="${p.imagen}" alt="${p.titulo}" class="catalogo-img">
                <div class="catalogo-info">
                    <h3 class="catalogo-title">${p.titulo}</h3>
                    <p class="catalogo-price">$${Number(p.precio).toLocaleString()}</p>
                    <button class="catalogo-btn" onclick="agregarAlCarrito('${p.titulo}', ${p.precio}, '${p.imagen}')">
                        Agregar al Carrito
                    </button>
                </div>
            </div>
        `).join("");
    } catch (error) {
        console.error("Error al cargar productos:", error);
    }
}

// 2. AGREGAR Y MODIFICAR CANTIDADES
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
    abrirCesta(); // Abre el modal "carrito-overlay"
}

function cambiarCantidad(index, delta) {
    let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    carrito[index].cantidad += delta;

    if (carrito[index].cantidad < 1) {
        carrito.splice(index, 1);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    actualizarInterfaz();
}

// 3. ACTUALIZAR LA VISTA DEL CARRITO (CONTENEDOR)
function actualizarInterfaz() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // Actualizar contador en el header
    const countEl = document.getElementById("cart-count");
    if (countEl) {
        const total = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        countEl.innerText = `(${total})`;
    }

    // Llenar el modal de productos
    const productosContenedor = document.getElementById("carrito-productos");
    const totalEl = document.getElementById("carrito-total");
    
    if (productosContenedor) {
        if (carrito.length === 0) {
            productosContenedor.innerHTML = "<p>Tu cesta está vacía</p>";
            if (totalEl) totalEl.innerText = "$0";
        } else {
            let totalGeneral = 0;
            productosContenedor.innerHTML = carrito.map((item, index) => {
                const subtotal = item.precio * item.cantidad;
                totalGeneral += subtotal;
                return `
                    <div class="carrito-item-mini" style="border-bottom:1px solid #eee; padding:10px 0;">
                        <strong>${item.titulo}</strong>
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <span>$${item.precio.toLocaleString()}</span>
                            <div>
                                <button onclick="cambiarCantidad(${index}, -1)">-</button>
                                <span>${item.cantidad}</span>
                                <button onclick="cambiarCantidad(${index}, 1)">+</button>
                            </div>
                            <span>$${subtotal.toLocaleString()}</span>
                        </div>
                    </div>
                `;
            }).join("");
            if (totalEl) totalEl.innerText = `$${totalGeneral.toLocaleString()}`;
        }
    }
}

// 4. PAGO CON LLAVE DE TEST
function irAPagarWompi() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (carrito.length === 0) return alert("El carrito está vacío");

    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    
    const totalCentavos = Math.floor(total * 100);
    const referencia = "TEST-" + Date.now();

    window.location.href = `https://checkout.wompi.co/p/?public-key=${LLAVE_TEST}&currency=COP&amount-in-cents=${totalCentavos}&reference=${referencia}`;
}

// FUNCIONES DE CONTROL DE MODAL
function abrirCesta() {
    const overlay = document.getElementById("carrito-overlay");
    if (overlay) overlay.style.display = "flex";
}

function cerrarCesta() {
    const overlay = document.getElementById("carrito-overlay");
    if (overlay) overlay.style.display = "none";
}

// INICIALIZACIÓN
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarInterfaz();
    
    // Vincular botón de cerrar
    const btnCerrar = document.getElementById("cerrar-carrito");
    if (btnCerrar) btnCerrar.onclick = cerrarCesta;

    // Vincular botón de pago final (el que está en el modal)
    const btnContinuar = document.getElementById("continuar-compra");
    if (btnContinuar) btnContinuar.onclick = irAPagarWompi;
});
