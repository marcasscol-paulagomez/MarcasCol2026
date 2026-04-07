function render() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const lista = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (carrito.length === 0) {
        lista.innerHTML = "<p>Carrito vacío</p>";
        return;
    }

    let total = 0;
    lista.innerHTML = carrito.map(p => {
        total += (p.precio * p.cantidad);
        return `<div style="display:flex; justify-content:space-between; padding:10px; border-bottom:1px solid #ddd;">
            <span>${p.titulo} x ${p.cantidad}</span>
            <span>$${(p.precio * p.cantidad).toLocaleString()}</span>
        </div>`;
    }).join("");

    totalEl.innerText = `Total: $${total.toLocaleString()}`;
}

function pagarConWompi() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let total = 0;
    carrito.forEach(p => total += (p.precio * p.cantidad));
    
    const montoCentavos = total * 100;
    const referencia = "MC-" + Date.now();
    const llavePublica = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    // LINK DIRECTO USANDO SOLO LLAVE PÚBLICA (Sin parámetro &signature)
    const urlWompi = `https://checkout.wompi.co/p/?public-key=${llavePublica}&currency=COP&amount-in-cents=${montoCentavos}&reference=${referencia}`;
    
    window.location.href = urlWompi;
}

document.addEventListener("DOMContentLoaded", () => {
    render();
    const btn = document.getElementById("btn-continuar");
    if (btn) {
        btn.onclick = () => {
            document.getElementById("wompi-box").innerHTML = `
                <button onclick="pagarConWompi()" style="width:100%; padding:20px; background:black; color:white; cursor:pointer;">
                    PAGAR AHORA CON WOMPI
                </button>`;
            document.getElementById("wompi-box").style.display = "block";
            btn.style.display = "none";
        };
    }
});
