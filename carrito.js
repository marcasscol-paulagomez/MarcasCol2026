const STORAGE_KEY = "carrito";

function getCarrito() { 
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; 
}

function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    const btnContinuar = document.getElementById("continuar");

    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p>Tu carrito está vacío.</p>";
        if (totalEl) totalEl.innerHTML = "";
        if (btnContinuar) btnContinuar.style.display = "none";
        return;
    }

    if (btnContinuar) btnContinuar.style.display = "block";

    let total = 0;
    list.innerHTML = carrito.map((p, i) => {
        const precioNum = parseFloat(p.precio) || 0;
        const subtotal = precioNum * (p.cantidad || 1);
        total += subtotal;
        return `<div style="border-bottom:1px solid #eee; padding:10px; display:flex; justify-content:space-between;">
                    <span>${p.titulo} (x${p.cantidad || 1})</span>
                    <span>$${subtotal.toLocaleString()}</span>
                </div>`;
    }).join("");
    totalEl.innerHTML = `<h3>Total: $${total.toLocaleString()}</h3>`;
}

// === CORRECCIÓN MAESTRA PARA WOMPI ===
function pagarConWompi() {
    const carrito = getCarrito();
    let total = 0;
    carrito.forEach(p => total += (parseFloat(p.precio) || 0) * (p.cantidad || 1));

    // REGLA 1: Centavos exactos sin decimales
    const totalCentavos = Math.floor(total * 100);
    
    // REGLA 2: Referencia única para evitar bloqueos
    const referencia = "MC-" + Date.now();

    // REGLA 3: Verificación de librería
    if (typeof WidgetCheckout === 'undefined') {
        alert("La pasarela de pago aún está cargando. Por favor, espera un segundo o recarga la página.");
        return;
    }

    // CONFIGURACIÓN EXACTA SEGÚN DOCUMENTACIÓN
    var checkout = new WidgetCheckout({
        currency: 'COP',
        amountInCents: totalCentavos,
        reference: referencia,
        publicKey: 'pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae' // Tu llave de producción
    });

    // Abrir el widget de forma dinámica
    checkout.open(function ( result ) {
        var transaction = result.transaction;
        if (transaction.status === 'APPROVED') {
            alert("¡Pago aprobado! Muchas gracias por tu compra en Marcas Col.");
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = "index.html";
        } else {
            alert("La transacción resultó: " + transaction.status + ". Por favor, intenta nuevamente.");
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
                // Navegación: Ocultar carrito y mostrar formulario
                document.getElementById("cart").classList.add("hidden");
                const checkoutSec = document.getElementById("checkout");
                checkoutSec.classList.remove("hidden");
                checkoutSec.style.display = "block"; // Asegura visibilidad

                // Generar el botón dinámicamente
                const container = document.getElementById("wompi-container");
                if (container) {
                    container.innerHTML = `
                        <button id="btn-wompi-dinamico" style="background-color: #000; color: #fff; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-weight: bold; border: none; width: 100%;">
                            PAGAR AHORA CON WOMPI
                        </button>`;
                    
                    document.getElementById("btn-wompi-dinamico").onclick = pagarConWompi;
                }
            } else {
                alert("El carrito está vacío.");
            }
        };
    }
});
