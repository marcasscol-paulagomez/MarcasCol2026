const STORAGE_KEY = "carrito";

function renderCarrito() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const lista = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (!lista) return;

    if (carrito.length === 0) {
        lista.innerHTML = "<h2>Tu carrito está vacío</h2>";
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

    let total = 0;
    lista.innerHTML = carrito.map((p, index) => {
        const subtotal = p.precio * p.cantidad;
        total += subtotal;
        return `
            <div style="display:flex; align-items:center; gap:20px; border-bottom:1px solid #ddd; padding:15px 0;">
                <img src="${p.imagen}" width="80" style="border-radius:10px;">
                <div style="flex-grow:1;">
                    <h3>${p.titulo}</h3>
                    <p>$${p.precio.toLocaleString()}</p>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <button onclick="cambiarCantidad(${index}, -1)" style="padding:5px 10px;">-</button>
                        <span>${p.cantidad}</span>
                        <button onclick="cambiarCantidad(${index}, 1)" style="padding:5px 10px;">+</button>
                    </div>
                </div>
                <div style="font-weight:bold; font-size:1.2rem;">$${subtotal.toLocaleString()}</div>
            </div>
        `;
    }).join("");

    totalEl.innerHTML = `
        <div style="text-align:right; margin-top:20px;">
            <h2>Total: $${total.toLocaleString()}</h2>
            <button id="btn-wompi-test" style="background:black; color:white; padding:20px; width:100%; cursor:pointer; font-weight:bold; border-radius:10px; margin-top:10px;">
                PAGAR CON WOMPI (PRUEBA)
            </button>
        </div>
    `;

    document.getElementById("btn-wompi-test").onclick = pagarWompiTest;
}

function cambiarCantidad(index, delta) {
    let carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    carrito[index].cantidad += delta;
    if (carrito[index].cantidad < 1) carrito.splice(index, 1);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    renderCarrito();
}

function pagarWompiTest() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    
    const totalCentavos = Math.floor(total * 100);
    const referencia = "TEST-" + Date.now();
    const llaveTest = "pub_test_Q5yS9J9ps9as03XpI89m266C7Uo6874e"; 

    window.location.href = `https://checkout.wompi.co/p/?public-key=${llaveTest}&currency=COP&amount-in-cents=${totalCentavos}&reference=${referencia}`;
}

document.addEventListener("DOMContentLoaded", renderCarrito);
