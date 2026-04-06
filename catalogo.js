// --- REEMPLAZA LA FUNCIÓN procesarPagoWompi EN TU CATALOGO.JS ---

async function procesarPagoWompi(titulo, precio) {
    // 1. Preparación de datos limpios
    const montoCentavos = Math.round(parseFloat(precio) * 100);
    const referencia = `MC${Date.now()}`; // Referencia limpia (ej: MC177550...)
    const moneda = "COP";
    const publicKey = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    try {
        // 2. Pedir firma al servidor
        const response = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=${moneda}`);
        
        if (!response.ok) throw new Error("Error al obtener firma");

        const data = await response.json();

        if (data.firma) {
            // 3. Construcción manual de la URL para evitar codificaciones erróneas
            const urlFinal = "https://checkout.wompi.co/p/?" + 
                             "public-key=" + publicKey + 
                             "&currency=" + moneda + 
                             "&amount-in-cents=" + montoCentavos + 
                             "&reference=" + referencia + 
                             "&signature=" + data.firma;

            // Redirección
            window.location.href = urlFinal;
        } else {
            alert("Error de configuración de seguridad.");
        }
    } catch (err) {
        console.error("Error:", err);
        alert("Hubo un error al conectar con la pasarela. Intenta de nuevo.");
    }
}
