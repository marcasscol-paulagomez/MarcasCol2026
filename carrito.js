const STORAGE_KEY = "carrito";

function render() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const lista = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (carrito.length === 0) {
        lista.innerHTML = "<p style='text-align:center;'>Tu carrito está vacío.</p>";
        totalEl.innerHTML = "";
        return;
    }

    let total = 0;
    lista.innerHTML = carrito.map((p, index) => {
        const subtotal = p.precio * p.cantidad;
        total += subtotal;
        return `
            <div style="display:flex; align-items:center; border-bottom:1px solid #eee; padding: 10px 0;">
                <img src="${p.imagen}" style="width:60px; height:60px; object-fit:cover; border-radius:5px;">
                <div style="flex-grow:1; margin-left:15px;">
                    <h4 style="margin:0;">${p.titulo}</h4>
                    <p style="margin:5px 0; color:#666;">$${p.precio.toLocaleString()} x ${p.cantidad}</p>
                </div>
                <strong>$${subtotal.toLocaleString()}</strong>
            </div>
        `;
    }).join("");

    totalEl.innerHTML = `Total: $${total.toLocaleString()}`;
}

async function pagar() {
    const carrito = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    
    const montoCentavos = Math.floor(total * 100);
    const referencia = "MC-" + Date.now();
    
    try {
        // Pedimos la firma al servidor
        const res = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=COP`);
        const data = await res.json();

        if (data.firma) {
            const publicKey = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";
            window.location.href = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=COP&amount-in-cents=${montoCentavos}&reference=${referencia}&signature=${data.firma}`;
        } else {
            alert("Error: No se pudo conectar con la seguridad de Wompi.");
        }
    } catch (e) {
        alert("Error de conexión con el servidor de Marcas Col.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    render();
    
    const btnCont = document.getElementById("btn-continuar");
    const wompiBox = document.getElementById("wompi-container");

    if (btnCont) {
        btnCont.onclick = () => {
            btnCont.style.display = "none";
            wompiBox.style.display = "block";
            wompiBox.innerHTML = `
                <button onclick="pagar()" style="width: 100%; padding: 15px; background: black; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    PAGAR AHORA CON WOMPI
                </button>
            `;
        };
    }
});
