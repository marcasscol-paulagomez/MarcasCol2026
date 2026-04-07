function renderCarritoFinal() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const lista = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!lista) return;

    if (carrito.length === 0) {
        lista.innerHTML = "<h3>Tu carrito está vacío</h3><a href='index.html'>Volver a la tienda</a>";
        return;
    }

    let total = 0;
    lista.innerHTML = carrito.map((p, index) => {
        const sub = p.precio * p.cantidad;
        total += sub;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding:10px;">
                <img src="${p.imagen}" width="60">
                <div style="flex-grow:1; margin-left:15px;">
                    <h4 style="margin:0;">${p.titulo}</h4>
                    <p style="margin:0;">Cant: ${p.cantidad} - $${sub.toLocaleString()}</p>
                </div>
            </div>`;
    }).join("");
    
    if (totalEl) totalEl.innerHTML = `<h3>Total a pagar: $${total.toLocaleString()}</h3>`;
}

async function irAPagarWompi() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    const montoCentavos = Math.floor(total * 100);
    const referencia = "MC-" + Date.now();
    const res = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=COP`);
    const data = await res.json();

    if (data.firma) {
        const publicKey = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";
        window.location.href = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${montoCentavos}&reference=${referencia}&signature=${data.firma}`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderCarritoFinal();
    const btnCont = document.getElementById("continuar");
    if (btnCont) {
        btnCont.onclick = () => {
            document.getElementById("wompi-container").innerHTML = '<button id="btn-pago" style="background:black; color:white; width:100%; padding:20px; cursor:pointer;">PAGAR AHORA</button>';
            document.getElementById("btn-pago").onclick = irAPagarWompi;
            document.getElementById("checkout").style.display = "block";
        };
    }
});
