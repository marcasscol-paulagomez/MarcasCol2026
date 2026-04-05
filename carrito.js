const STORAGE_KEY = "carrito";

function getCarrito() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }

function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:30px; color:#888;'>Tu carrito está vacío.</p>";
        if (totalEl) totalEl.innerHTML = "";
        document.getElementById("continuar").style.display = "none";
        return;
    }

    let total = 0;
    list.innerHTML = carrito.map((p) => {
        const precioNum = parseFloat(p.precio) || 0;
        const subtotal = precioNum * (p.cantidad || 1);
        total += subtotal;
        return `
            <div class="carrito-item">
                <img src="${p.imagen}" alt="${p.titulo}">
                <div class="carrito-info">
                    <h4>${p.titulo}</h4>
                    <p>$${precioNum.toLocaleString()}</p>
                    <small style="color:#666">Cant: ${p.cantidad || 1}</small>
                </div>
                <div style="font-weight:bold;">$${subtotal.toLocaleString()}</div>
            </div>`;
    }).join("");

    totalEl.innerHTML = `<span style="font-size:1.2rem; color:#666;">Total:</span> 
                         <strong style="font-size:1.5rem; margin-left:10px;">$${total.toLocaleString()}</strong>`;
}

// FUNCIÓN DE REDIRECCIÓN A PAGO REAL (PRODUCCIÓN)
function finalizarCompraProduccion() {
    const carrito = getCarrito();
    let total = 0;
    carrito.forEach(p => total += (parseFloat(p.precio) || 0) * (p.cantidad || 1));

    const totalCentavos = Math.floor(total * 100);
    const referencia = "MC-ORDER-" + Date.now();
    
    // TU LLAVE DE PRODUCCIÓN OFICIAL
    const llavePublica = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    // URL DE REDIRECCIÓN DIRECTA (Evita bloqueos de pantalla blanca)
    const urlWompi = `https://checkout.wompi.co/p/?public-key=${llavePublica}&currency=COP&amount-in-cents=${totalCentavos}&reference=${referencia}&redirect-url=https://www.marcascol-bypaulagomez.com/confirmacion.html`;
    
    console.log("Iniciando pago en producción...");
    window.location.href = urlWompi;
}

document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const btnContinuar = document.getElementById("continuar");
    if (btnContinuar) {
        btnContinuar.onclick = () => {
            const carrito = getCarrito();
            if (carrito.length > 0) {
                // Cambiar de vista
                document.getElementById("cart").classList.add("hidden");
                const checkoutSec = document.getElementById("checkout");
                checkoutSec.classList.remove("hidden");
                checkoutSec.style.display = "block";

                // Inyectar el botón de pago de Marcas Col
                const container = document.getElementById("wompi-container");
                container.innerHTML = `
                    <button id="btn-pagar-real">
                        PAGAR AHORA CON WOMPI
                    </button>
                `;
                
                document.getElementById("btn-pagar-real").onclick = finalizarCompraProduccion;
                
                // Desplazar hacia arriba suavemente
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    }
});
