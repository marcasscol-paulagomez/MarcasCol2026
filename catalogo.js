// ============================================================
// === MARCAS COL - CONFIGURACIÓN DE SEGURIDAD Y PAGOS ===
// ============================================================

// 1. Mostrar mensaje superior
async function cargarMensajeCatalogo() {
    try {
        const res = await fetch('/mensaje/ultimo');
        const data = await res.json();
        const msgDiv = document.getElementById('mensaje-superior');
        if (data.mensaje) {
            msgDiv.textContent = data.mensaje;
            msgDiv.style.display = "block";
        } else {
            msgDiv.style.display = "none";
        }
    } catch (err) {
        console.error("No se pudo cargar el mensaje:", err);
    }
}

// ================================
// === SLIDER / BANNER PRINCIPAL ===
// ================================
function inicializarSlider() {
    let idx = 0;
    let timer = null;
    const slider = document.getElementById("catalogo-slider");
    if (!slider) return;

    const track = slider.querySelector(".slider-track");
    let slides = Array.from(slider.querySelectorAll(".slider-slide"));
    const dots = Array.from(slider.querySelectorAll(".slider-dots .dot"));

    if (!track || slides.length === 0) return;

    function ajustarAnchos() {
        const w = slider.clientWidth;
        slides.forEach(s => {
            s.style.width = `${w}px`;
            s.style.minWidth = `${w}px`;
        });
        track.style.width = `${w * slides.length}px`;
        track.style.transform = `translateX(-${idx * w}px)`;
    }

    function showSlide(i) {
        if (i < 0) i = slides.length - 1;
        if (i >= slides.length) i = 0;
        idx = i;
        const w = slider.clientWidth;
        track.style.transform = `translateX(-${i * w}px)`;
        dots.forEach((d, j) => d.classList.toggle("active", j === i));
    }

    function auto() {
        clearInterval(timer);
        if (slides.length > 1) timer = setInterval(() => showSlide(idx + 1), 6000);
    }

    window.addEventListener("resize", ajustarAnchos);
    ajustarAnchos();
    showSlide(0);
    auto();
}

// ==============================
// === PRODUCTOS Y FILTROS ======
// ==============================

async function fetchProductos() {
    const res = await fetch("/products");
    return res.ok ? await res.json() : [];
}

function renderProductos(productos, filtro = "") {
    const list = document.getElementById("catalogo-list");
    if (!list) return;

    let filtrados = productos;
    if (filtro) {
        const f = filtro.toLowerCase();
        filtrados = productos.filter(p => p.titulo.toLowerCase().includes(f));
    }

    list.innerHTML = filtrados.map(p => `
        <div class="catalogo-card">
            <img src="${p.imagen}" alt="${p.titulo}" class="catalogo-img">
            <div class="catalogo-title">${p.titulo}</div>
            <div class="catalogo-section">${p.marca} - ${p.seccion}</div>
            <div class="catalogo-price">$${p.precio}</div>
            <button class="catalogo-btn" 
                onclick="procesarPagoDirecto('${p.titulo}', ${p.precio})">
                Comprar ahora
            </button>
        </div>
    `).join("");
}

// ============================================================
// === LÓGICA DE PAGO CON FIRMA DE INTEGRIDAD (WOMPI) ===
// ============================================================

async function procesarPagoDirecto(titulo, precio) {
    const montoCentavos = Math.round(precio * 100);
    const referencia = `MC-${Date.now()}`; // Referencia única
    const moneda = "COP";
    const publicKey = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae"; // Tu llave pública

    try {
        // 1. Pedir la firma de integridad al servidor de Railway
        const res = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=${moneda}`);
        const data = await res.json();

        if (!data.firma) {
            alert("Error: No se pudo validar la seguridad del pago. Verifica la llave en Railway.");
            return;
        }

        // 2. Construir la URL de Wompi incluyendo el parámetro &signature=
        const urlWompi = `https://checkout.wompi.co/p/?` +
                         `public-key=${publicKey}` +
                         `&currency=${moneda}` +
                         `&amount-in-cents=${montoCentavos}` +
                         `&reference=${referencia}` +
                         `&signature=${data.firma}`; // <--- AQUÍ SE AGREGA LA FIRMA

        // 3. Redirigir al cliente (Ya no saldrá en blanco)
        window.location.href = urlWompi;

    } catch (err) {
        console.error("Error en el proceso de pago:", err);
        alert("Hubo un problema al conectar con la pasarela de pago.");
    }
}

// ============================================================
// === INICIALIZACIÓN GLOBAL ===
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    await cargarMensajeCatalogo();
    const productos = await fetchProductos();
    renderProductos(productos);
    
    // Iniciar el slider después de cargar datos
    const slidesData = await fetch("/slides").then(res => res.json()).catch(() => []);
    if(slidesData.length > 0) renderSlidesDyn(slidesData);

    // Búsqueda
    document.getElementById("search-input")?.addEventListener("input", (e) => {
        renderProductos(productos, e.target.value);
    });
});

// Función auxiliar para renderizar slides si hay datos
function renderSlidesDyn(slides) {
    const slider = document.getElementById("catalogo-slider");
    if (!slider) return;
    // ... (Tu lógica de renderizado de slides que ya tenías)
    inicializarSlider();
}
