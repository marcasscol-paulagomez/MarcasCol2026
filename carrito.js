const STORAGE_KEY = "carrito";

function getCarrito() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }

function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p>Tu carrito está vacío.</p>";
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

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

function pagarConWompi() {
    const carrito = getCarrito();
    let total = 0;
    carrito.forEach(p => total += (parseFloat(p.precio) || 0) * (p.cantidad || 1));

    // REGLA WOMPI: Centavos sin decimales
    const totalCentavos = Math.floor(total * 100);
    
    // REGLA WOMPI: Referencia única para evitar pantalla blanca por duplicidad
    const referencia = "MC-" + Date.now();

    if (typeof WidgetCheckout === 'undefined') {
        alert("Wompi aún está cargando. Espera un segundo.");
        return;
    }

    // Configuración Dinámica según la documentación
    var checkout = new WidgetCheckout({
        currency: 'COP',
        amountInCents: totalCentavos,
        reference: referencia,
        publicKey: 'pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae'
    });

    checkout.open(function ( result ) {
        var transaction = result.transaction;
        if (transaction.status === 'APPROVED') {
            alert("¡Pago aprobado! Gracias por comprar en Marcas Col.");
            localStorage.removeItem(STORAGE_KEY);
            window.location.href = "index.html";
        } else {
            alert("La transacción resultó: " + transaction.status);
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
                // Navegación
                document.getElementById("cart").classList.add("hidden");
                const checkoutSec = document.getElementById("checkout");
                checkoutSec.classList.remove("hidden");

                // Generar el botón dinámicamente para que Wompi lo reconozca bien
                const container = document.getElementById("wompi-container");
                container.innerHTML = `<button id="btn-wompi-dinamico">PAGAR CON WOMPI</button>`;
                
                document.getElementById("btn-wompi-dinamico").onclick = pagarConWompi;
            } else {
                alert("El carrito está vacío.");
            }
        };
    }
});
