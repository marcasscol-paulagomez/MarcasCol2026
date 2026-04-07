const STORAGE_KEY = "carrito";

function render() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const lista = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!lista) return;

    if (carrito.length === 0) {
        lista.innerHTML = "<h2>Tu carrito está vacío</h2>";
        return;
    }

    let total = 0;
    lista.innerHTML = carrito.map((p, index) => {
        total += (p.precio * p.cantidad);
        return `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding:10px;">
                <span>${p.titulo} (x${p.cantidad})</span>
                <span>$${(p.precio * p.cantidad).toLocaleString()}</span>
            </div>`;
    }).join("");

    totalEl.innerHTML = `
        <h2 style="text-align:right;">Total: $${total.toLocaleString()}</h2>
        <button id="btn-pago-test" style="width:100%; padding:20px; background:green; color:white; font-weight:bold; cursor:pointer; border-radius:10px;">
            PROBAR PAGO CON WOMPI
        </button>`;

    document.getElementById("btn-pago-test").onclick = () => {
        const totalCentavos = Math.floor(total * 100);
        const referencia = "TEST-" + Date.now();
        const llaveTest = "pub_test_Q5yS9J9ps9as03XpI89m266C7Uo6874e"; 
        window.location.href = `https://checkout.wompi.co/p/?public-key=${llaveTest}&currency=COP&amount-in-cents=${totalCentavos}&reference=${referencia}`;
    };
}

document.addEventListener("DOMContentLoaded", render);
