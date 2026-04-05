const STORAGE_KEY = "carrito";

function getCarrito() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }

function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px;'>Tu carrito está vacío.</p>";
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

    let total = 0;
    list.innerHTML = carrito.map((p, i) => {
        const precioNum = parseFloat(p.precio) || 0;
        const subtotal = precioNum * (p.cantidad || 1);
        total += subtotal;
        return `
            <div style="border-bottom:1px solid #eee; padding:15px; display:flex; align-items:center; gap:15px;">
                <img src="${p.imagen}" style="width:60px; border-radius:5px;">
                <div style="flex-grow:1;">
                    <h4 style="margin:0;">${p.titulo}</h4>
                    <p style="margin:0; color:#28a745;">$${precioNum.toLocaleString()}</p>
                </div>
                <span>x${p.cantidad || 1}</span>
            </div>`;
    }).join("");
    totalEl.innerHTML = `<h3 style="text-align:right;">Total: $${total.toLocaleString()}</h3>`;
}

// === GENERADOR DE FIRMA (PASO A PASO WOMPI) ===
function generarFirma(referencia, centavos) {
    // ESTO ES PARA MODO PRUEBA (Llave de integridad de Test)
    // Si Wompi te pide secreto de integridad en modo TEST, lo pones aquí:
    const secretoTest = "test_integrity_Z6vIe9mN9pS6Y8kR3vX7pY1wL0kQ9zV4"; 
    const cadenaOriginal = referencia + centavos + "COP" + secretoTest;
    
    const hash = CryptoJS.SHA256(cadenaOriginal);
    return hash.toString(CryptoJS.enc.Hex);
}

async function pagarConWompi() {
    const carrito = getCarrito();
    let total = 0;
    carrito.forEach(p => total += (parseFloat(p.precio) || 0) * (p.cantidad || 1));

    const totalCentavos = Math.floor(total * 100);
    const referencia = "MC-TEST-" + Date.now();
    
    // Generamos la firma de seguridad
    const firmaIntegridad = generarFirma(referencia, totalCentavos);

    if (typeof WidgetCheckout === 'undefined') {
        alert("Wompi está cargando...");
        return;
    }

    var checkout = new WidgetCheckout({
        currency: 'COP',
        amountInCents: totalCentavos,
        reference: referencia,
        publicKey: 'pub_test_cQrYMdUpn35pBXI9Rr7gJyyM7l0d793c', // <--- TU LLAVE DE PRUEBA
        signature: { integrity: firmaIntegridad } // Enviamos la firma para evitar pantalla blanca
    });

    checkout.open(function ( result ) {
        var transaction = result.transaction;
        if (transaction.status === 'APPROVED') {
            alert("¡PRUEBA EXITOSA! El pago fue simulado correctamente.");
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
            document.getElementById("cart").classList.add("hidden");
            const checkoutSec = document.getElementById("checkout");
            checkoutSec.classList.remove("hidden");
            checkoutSec.style.display = "block";

            const container = document.getElementById("wompi-container");
            container.innerHTML = `<button id="btn-pago-real" style="background:#000; color:#fff; width:100%; padding:15px; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">REALIZAR PAGO DE PRUEBA</button>`;
            document.getElementById("btn-pago-real").onclick = pagarConWompi;
        };
    }
});
