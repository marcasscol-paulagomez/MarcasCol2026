// ============================================================
// === MARCAS COL - CATÁLOGO Y PAGOS SEGUROS ===
// ============================================================

// 1. Cargar el mensaje dinámico del administrador
async function cargarMensajeCatalogo() {
    try {
        const res = await fetch('/mensaje/ultimo');
        const data = await res.json();
        const msgDiv = document.getElementById('mensaje-superior');
        if (msgDiv && data.mensaje) {
            msgDiv.textContent = data.mensaje;
            msgDiv.style.display = "block";
        }
    } catch (err) {
        console.error("Error al cargar mensaje superior:", err);
    }
}

// 2. Obtener productos de la base de datos de Railway
async function fetchProductos() {
    try {
        const res = await fetch("/products");
        return res.ok ? await res.json() : [];
    } catch (err) {
        return [];
    }
}

// 3. Dibujar productos en la pantalla
function renderProductos(productos) {
    const list = document.getElementById("catalogo-list");
    if (!list) return;

    list.innerHTML = productos.map(p => `
        <div class="catalogo-card">
            <img src="${p.imagen}" alt="${p.titulo}" class="catalogo-img">
            <div class="catalogo-title">${p.titulo}</div>
            <div class="catalogo-section">${p.marca} - ${p.seccion}</div>
            <div class="catalogo-price">$${Number(p.precio).toLocaleString('es-CO')}</div>
            <button class="catalogo-btn" 
                onclick="procesarPagoWompi('${p.titulo}', ${p.precio})">
                Comprar ahora
            </button>
        </div>
    `).join("");
}

// ============================================================
// === MOTOR DE PAGOS CON FIRMA DE INTEGRIDAD ===
// ============================================================

async function procesarPagoWompi(titulo, precio) {
    // Wompi exige el monto en centavos sin decimales
    const montoCentavos = Math.round(precio * 100);
    const referencia = `MC-${Date.now()}`; 
    const moneda = "COP";
    const publicKey = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    try {
        // Llamada al servidor para obtener la firma (Indispensable para Wompi)
        const response = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=${moneda}`);
        
        if (!response.ok) {
            throw new Error("El servidor de firmas no responde.");
        }

        const data = await response.json();

        if (!data.firma) {
            alert("Error de configuración: No se encontró la llave de integridad en Railway.");
            return;
        }

        // Construcción del enlace final con el parámetro de firma
        const urlFinal = `https://checkout.wompi.co/p/?` +
                         `public-key=${publicKey}` +
                         `&currency=${moneda}` +
                         `&amount-in-cents=${montoCentavos}` +
                         `&reference=${referencia}` +
                         `&signature=${data.firma}`;

        // Redirección inmediata
        window.location.href = urlFinal;

    } catch (err) {
        console.error("Error en el proceso de pago:", err);
        alert("Hubo un error al conectar con Wompi. Por favor intenta de nuevo.");
    }
}

// ============================================================
// === INICIO DE LA APLICACIÓN ===
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    cargarMensajeCatalogo();
    const productos = await fetchProductos();
    renderProductos(productos);

    // Búsqueda simple
    document.getElementById("search-input")?.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtrados = productos.filter(p => p.titulo.toLowerCase().includes(term));
        renderProductos(filtrados);
    });
});
