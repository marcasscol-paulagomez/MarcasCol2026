async function irAPagarWompi() {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    let total = 0;
    carrito.forEach(p => total += (p.precio * (p.cantidad || 1)));
    
    const montoCentavos = Math.floor(total * 100);
    const referencia = "MC-" + Date.now();
    const moneda = "COP";
    const publicKey = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    try {
        const res = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=${moneda}`);
        const data = await res.json();

        if (data.firma) {
            window.location.href = `https://checkout.wompi.co/p/?public-key=${publicKey}&currency=${moneda}&amount-in-cents=${montoCentavos}&reference=${referencia}&signature=${data.firma}`;
        }
    } catch (e) { alert("Error de conexión"); }
}
