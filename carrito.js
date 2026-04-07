const STORAGE_KEY = "carrito";

function render() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const lista = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (!lista) return;

    if (carrito.length === 0) {
        lista.innerHTML = "<h2>Tu carrito está vacío</h2><a href='index.html'>Volver a la tienda</a>";
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

    let total = 0;
    // IMPORTANTE: Aquí leemos exactamente lo que guardó catalogo.js
    lista.innerHTML = carrito.map((p, index) => {
        const subtotal = p.precio * p.cantidad;
        total += subtotal;
        return `
            <div style="display:flex; align-items:center; gap:20px; border-bottom:1px solid #ddd; padding:15px 0;">
                <img src="${p.imagen}" width="80" style="border-radius:10px;">
                <div style="flex-grow:1;">
                    <h3>${p.titulo}</h3>
                    <p>$${Number(p.precio).toLocaleString()}</p>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <button onclick="cambiarCant(${index}, -1)">-</button>
                        <span>${p.cantidad}</span>
                        <button onclick="cambiarCant(${index}, 1)">+</button>
                    </div>
                </div>
                <strong>$${subtotal.toLocaleString()}</strong>
            </div>
        `;
    }).join("");

    totalEl.innerHTML = `
        <div style="text-align:right; margin-top:20px;">
            <h2>Total: $${total.toLocaleString()}</h2>
            <button id="btn-pago-test" style="background:black; color:white; width:100%; padding:20px; border-radius:10px; cursor:pointer; font-weight:bold;">
                PAGAR CON WOMPI (MODO TEST)
            </button>
        </div>
    `;

    document.getElementById("btn-pago-test").onclick = enviarAWompi;
}

function cambiarCant(index, delta) {
    let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    carrito[index].cantidad += delta;
    if (carrito[index].cantidad < 1) carrito.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    render();
}

function enviarAWompi() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    
    const montoCentavos = Math.floor(total * 100);
    const referencia = "TEST-" + Date.now();
    const llaveTest = "pub_test_Q5yS9J9ps9as03XpI89m266C7Uo6874e"; 

    window.location.href = `https://checkout.wompi.co/p/?public-key=${llaveTest}&currency=COP&amount-in-cents=${montoCentavos}&reference=${referencia}`;
}

document.addEventListener("DOMContentLoaded", render);
