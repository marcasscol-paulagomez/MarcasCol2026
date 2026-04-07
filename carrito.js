const STORAGE_KEY = "carrito";

function renderCarritoFinal() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!list) return;

    let total = 0;
    list.innerHTML = carrito.map(p => {
        total += (p.precio * p.cantidad);
        return `<div class="carrito-item">
            <h4>${p.titulo} (x${p.cantidad})</h4>
            <p>$${(p.precio * p.cantidad).toLocaleString()}</p>
        </div>`;
    }).join("");
    if (totalEl) totalEl.innerHTML = `<strong>Total: $${total.toLocaleString()}</strong>`;
}

async function irAPagarWompi() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    
    const montoCentavos = Math.floor(total * 100);
    const referencia = "MC-" + Date.now();
    const moneda = "COP";
    const publicKey = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    try {
        const res = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=${moneda}`);
        const data = await res.json();

        if (data.firma) {
            window.location.href = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=${moneda}&amount-in-cents=${montoCentavos}&reference=${referencia}&signature=${data.firma}`;
        } else {
            alert("Error de seguridad en el servidor.");
        }
    } catch (e) {
        alert("Error al conectar con la pasarela.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderCarritoFinal();
    const btnPagar = document.getElementById("btn-pagar-real");
    if (btnPagar) btnPagar.onclick = irAPagarWompi;
});
