function renderCarritoFinal() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const lista = document.getElementById("carrito-list");
    let total = 0;
    if (!lista) return;

    lista.innerHTML = carrito.map(p => {
        const subtotal = p.precio * p.cantidad;
        total += subtotal;
        return `<div>${p.titulo} x${p.cantidad} - $${subtotal.toLocaleString()}</div>`;
    }).join("");
    
    document.getElementById("carrito-total").innerHTML = `<strong>Total: $${total.toLocaleString()}</strong>`;
}

async function irAPagarWompi() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    
    const montoCentavos = Math.floor(total * 100);
    const referencia = "MC-" + Date.now();
    const moneda = "COP";
    const publicKey = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    const res = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=${moneda}`);
    const data = await res.json();

    if (data.firma) {
        window.location.href = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=${moneda}&amount-in-cents=${montoCentavos}&reference=${referencia}&signature=${data.firma}`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderCarritoFinal();
    const btnPagar = document.getElementById("btn-pagar-real");
    if (btnPagar) btnPagar.onclick = irAPagarWompi;
});
