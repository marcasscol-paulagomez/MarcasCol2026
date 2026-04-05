const STORAGE_KEY = "carrito";

function getCarrito() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }

function guardarCarrito(carrito) { localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito)); }

function eliminarDelCarrito(index) {
    let carrito = getCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
    renderCarrito();
}

function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding: 40px;'>Tu carrito está vacío.</p>";
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

    let total = 0;
    list.innerHTML = carrito.map((p, i) => {
        const precioNum = parseFloat(p.precio) || 0;
        const subtotal = precioNum * (p.cantidad || 1);
        total += subtotal;
        
        return `
            <div class="carrito-item">
                <img src="${p.imagen}" alt="${p.titulo}">
                <div class="carrito-info">
                    <h3 style="margin:0; font-size:1rem;">${p.titulo}</h3>
                    <p style="margin:5px 0; color:#28a745; font-weight:bold;">$${precioNum.toLocaleString()}</p>
                    <small>Cantidad: ${p.cantidad || 1}</small>
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})">❌</button>
            </div>
        `;
    }).join("");

    totalEl.innerHTML = `<h2 style="text-align:right;">Total a pagar: $${total.toLocaleString()}</h2>`;
}

// === FUNCIÓN DE PAGO DINÁMICO (Sin pantalla blanca) ===
function pagarConWompi() {
    const carrito = getCarrito();
    let total = 0;
    carrito.forEach(p => total += (parseFloat(p.precio) || 0) * (p.cantidad || 1));

    const totalCentavos = Math.floor(total * 100);
    const referenciaUnica = "MC-" + Date.now(); // Recomendación Wompi

    if (typeof WidgetCheckout === 'undefined') {
        alert("La plataforma de pago está cargando, intenta de nuevo en 2 segundos.");
        return;
    }

    // Configuración recomendada por la documentación de Wompi
    var checkout = new WidgetCheckout({
        currency: 'COP',
        amountInCents: totalCentavos,
        reference: referenciaUnica,
        publicKey: 'pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae'
    });

    checkout.open(function ( result ) {
        var transaction = result.transaction;
        if (transaction.status === 'APPROVED') {
            alert("¡Pago Exitoso! Pronto recibirás tus productos de Marcas Col.");
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = "index.html";
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const btnContinuar = document.getElementById("continuar");
    if (btnContinuar) {
        btnContinuar.onclick = () => {
            const carrito = getCarrito();
            if (carrito.length > 0) {
                // Navegación fluida
                document.getElementById("cart").style.display = "none";
                const checkoutSec = document.getElementById("checkout");
                checkoutSec.classList.remove("hidden");
                checkoutSec.style.display = "block";

                // Inyectar el botón de pago dinámico
                const container = document.getElementById("wompi-container");
                if (container) {
                    container.innerHTML = `<button id="btn-wompi-dinamico">PAGAR AHORA CON WOMPI</button>`;
                    document.getElementById("btn-wompi-dinamico").onclick = pagarConWompi;
                }
                
                // Scroll automático al formulario
                checkoutSec.scrollIntoView({ behavior: 'smooth' });
            } else {
                alert("El carrito está vacío.");
            }
        };
    }
});
