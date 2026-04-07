// Configuración inicial
const STORAGE_KEY = "carrito";

async function cargarProductos() {
    try {
        const res = await fetch('/products');
        const productos = await res.json();
        const lista = document.getElementById("catalogo-list");
        if (!lista) return;

        if (productos.length === 0) {
            lista.innerHTML = "<p style='text-align:center;'>No hay productos disponibles por ahora.</p>";
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
    document.getElementById("carrito-overlay").style.display = "flex";
}

function actualizarInterfaz() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    // Contador del header
    const countEl = document.getElementById("cart-count");
    if (countEl) {
        const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
        countEl.innerText = `(${totalItems})`;
    }

    // Lista del modal (Cesta)
    const productosContenedor = document.getElementById("carrito-productos");
    const totalEl = document.getElementById("carrito-resumen");
    const btnContinuar = document.getElementById("continuar-compra");

    if (productosContenedor) {
        if (carrito.length === 0) {
            productosContenedor.innerHTML = "<p>Tu cesta está vacía</p>";
            if (totalEl) totalEl.innerText = "Total: $0";
            if (btnContinuar) btnContinuar.disabled = true;
        } else {
            let totalGeneral = 0;
            productosContenedor.innerHTML = carrito.map((item, index) => {
                const subtotal = item.precio * item.cantidad;
                totalGeneral += subtotal;
                return `
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:5px;">
                        <div style="font-size:0.9rem;">
                            <strong>${item.titulo}</strong><br>
                            $${item.precio.toLocaleString()} x ${item.cantidad}
                        </div>
                        <div style="font-weight:bold;">$${subtotal.toLocaleString()}</div>
                    </div>
                `;
            }).join("");
            if (totalEl) totalEl.innerHTML = `<strong>Total: $${totalGeneral.toLocaleString()}</strong>`;
            if (btnContinuar) {
                btnContinuar.disabled = false;
                btnContinuar.onclick = () => window.location.href = 'carrito.html';
            }
        }
    }
}

// Eventos de botones
document.addEventListener("DOMContentLoaded", () => {
    cargarProductos();
    actualizarInterfaz();

    document.getElementById("btn-carrito").onclick = () => {
        document.getElementById("carrito-overlay").style.display = "flex";
    };

    document.getElementById("cerrar-carrito").onclick = () => {
        document.getElementById("carrito-overlay").style.display = "none";
    };
});
