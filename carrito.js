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
            <div class="carrito-item" style="display:flex; align-items:center; gap:10px; border-bottom:1px solid #eee; padding:10px;">
                <img src="${p.imagen}" style="width:50px; border-radius:5px;">
                <div style="flex-grow:1;">
                    <h4 style="margin:0; font-size:0.9rem;">${p.titulo}</h4>
                    <p style="margin:0; color:#28a745; font-size:0.8rem;">$${precioNum.toLocaleString()}</p>
                </div>
            </div>`;
    }).join("");
    totalEl.innerHTML = `<h3 style="text-align:right;">Total: $${total.toLocaleString()}</h3>`;
}

// ESTA FUNCIÓN ES LA QUE SOLUCIONA TODO
function irAPagarWompi() {
    const carrito = getCarrito();
    let total = 0;
    carrito.forEach(p => total += (parseFloat(p.precio) || 0) * (p.cantidad || 1));

    const totalCentavos = Math.floor(total * 100);
    const referencia = "MC-TEST-" + Date.now();
    const llavePublica = "pub_test_cQrYMdUpn35pBXI9Rr7gJyyM7l0d793c"; // Tu llave de prueba

    // Construimos la URL de pago directo (Sin ventanitas que se bloqueen)
    const urlWompi = `https://checkout.wompi.co/p/?public-key=${llavePublica}&currency=COP&amount-in-cents=${totalCentavos}&reference=${referencia}`;
    
    console.log("Redirigiendo a Wompi...");
    window.location.href = urlWompi;
}

document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const btnContinuar = document.getElementById("continuar");
    if (btnContinuar) {
        btnContinuar.onclick = () => {
            const carrito = getCarrito();
            if (carrito.length > 0) {
                document.getElementById("cart").classList.add("hidden");
                const checkoutSec = document.getElementById("checkout");
                checkoutSec.classList.remove("hidden");
                checkoutSec.style.display = "block";

                const container = document.getElementById("wompi-container");
                // Creamos un botón estándar que nos mande a la otra página
                container.innerHTML = `
                    <button id="btn-final" style="background:#000; color:#fff; width:100%; padding:18px; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:1.1rem;">
                        PAGAR AHORA CON WOMPI
                    </button>
                `;
                
                document.getElementById("btn-final").onclick = irAPagarWompi;
            }
        };
    }
});
