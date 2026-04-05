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
        const btnCont = document.getElementById("continuar");
        if (btnCont) btnCont.style.display = "none";
        return;
    }

    let total = 0;
    list.innerHTML = carrito.map((p, i) => {
        const subtotal = parseFloat(p.precio) * (p.cantidad || 1);
        total += subtotal;
        return `<div style="border-bottom:1px solid #eee; padding:10px; display:flex; justify-content:space-between; align-items:center;">
                    <span>${p.titulo} (x${p.cantidad || 1})</span>
                    <span>$${subtotal.toLocaleString()}</span>
                </div>`;
    }).join("");
    totalEl.innerHTML = `<h3>Total: $${total.toLocaleString()}</h3>`;
}

// FUNCIÓN PARA ABRIR EL CHECKOUT DE WOMPI SIN PANTALLA BLANCA
function pagarConWompi() {
    const carrito = getCarrito();
    let total = 0;
    carrito.forEach(p => total += parseFloat(p.precio) * (p.cantidad || 1));

    const totalCentavos = Math.round(total * 100);
    const referencia = "MC-" + Date.now();

    // Verificamos que la librería de Wompi esté cargada
    if (typeof WidgetCheckout === 'undefined') {
        alert("La pasarela de pago está cargando, por favor intenta en un momento.");
        return;
    }

    var checkout = new WidgetCheckout({
        currency: 'COP',
        amountInCents: totalCentavos,
        reference: referencia,
        publicKey: 'pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae'
    });

    checkout.open(function ( result ) {
        var transaction = result.transaction;
        if (transaction.status === 'APPROVED') {
            alert("¡Pago aprobado! Muchas gracias por tu compra.");
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
                document.getElementById("cart").classList.add("hidden");
                document.getElementById("checkout").classList.remove("hidden");
                
                // Creamos un botón de pago real que dispare la función dinámica
                const container = document.getElementById("wompi-container");
                container.innerHTML = `
                    <button id="btn-wompi-dinamico" style="background-color: #000; color: #fff; padding: 15px 30px; border-radius: 5px; cursor: pointer; font-weight: bold; border: none; width: 100%;">
                        PAGAR AHORA
                    </button>
                `;
                
                document.getElementById("btn-wompi-dinamico").onclick = pagarConWompi;
            }
        };
    }
});
