const STORAGE_KEY = "carrito";

function getCarrito() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }

function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p>Tu carrito está vacío.</p>";
        totalEl.innerHTML = "";
        document.getElementById("continuar").style.display = "none";
        return;
    }

    let total = 0;
    list.innerHTML = carrito.map((p, i) => {
        const subtotal = parseFloat(p.precio) * (p.cantidad || 1);
        total += subtotal;
        return `<div style="border-bottom:1px solid #eee; padding:10px; display:flex; justify-content:space-between;">
                    <span>${p.titulo} (x${p.cantidad || 1})</span>
                    <span>$${subtotal.toLocaleString()}</span>
                </div>`;
    }).join("");
    totalEl.innerHTML = `Total: $${total.toLocaleString()}`;
}

function inyectarWompi(total) {
    const container = document.getElementById("wompi-container");
    if (!container) return;

    const totalCentavos = Math.round(total * 100);
    const referencia = "MC-" + Date.now();

    container.innerHTML = ""; // Limpiar mensaje de carga

    const script = document.createElement("script");
    script.src = "https://checkout.wompi.co/widget.js";
    script.setAttribute("data-render", "button");
    script.setAttribute("data-public-key", "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae");
    script.setAttribute("data-currency", "COP");
    script.setAttribute("data-amount-in-cents", totalCentavos.toString());
    script.setAttribute("data-reference", referencia);
    
    container.appendChild(script);
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
                
                let total = 0;
                carrito.forEach(p => total += parseFloat(p.precio) * (p.cantidad || 1));
                inyectarWompi(total);
            }
        };
    }
});
