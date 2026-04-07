const STORAGE_KEY = "carrito";

function render() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const lista = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!lista) return;

    let total = 0;
    lista.innerHTML = carrito.map(p => {
        total += (p.precio * p.cantidad);
        return `<div style="border-bottom:1px solid #eee; padding:10px;">
            ${p.titulo} (x${p.cantidad}) - $${(p.precio * p.cantidad).toLocaleString()}
        </div>`;
    }).join("");

    totalEl.innerHTML = `
        <h2>Total: $${total.toLocaleString()}</h2>
        <button id="btn-pago-test" style="width:100%; padding:20px; background:green; color:white; font-weight:bold; cursor:pointer; border-radius:10px;">
            PAGAR AHORA (TEST)
        </button>
    `;

    document.getElementById("btn-pago-test").onclick = pagarTest;
}

function pagarTest() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    
    const montoCentavos = Math.floor(total * 100);
    const referencia = "TEST-" + Date.now();
    const llaveTest = "pub_test_Q5yS9J9ps9as03XpI89m266C7Uo6874e"; 

    // REDIRECCIÓN DIRECTA QUE FUNCIONÓ
    window.location.href = `https://checkout.wompi.co/p/?public-key=${llaveTest}&currency=COP&amount-in-cents=${montoCentavos}&reference=${referencia}`;
}

document.addEventListener("DOMContentLoaded", render);
