// ============================================================
// === MARCAS COL - CONFIGURACIÓN DE SEGURIDAD Y PAGOS ===
// ============================================================

// 1. Mostrar mensaje superior dinámico
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
    try {
        const res = await fetch("/products");
        return res.ok ? await res.json() : [];
    } catch (err) {
        console.error("Error cargando productos:", err);
        return [];
    }
}

function renderProductos(productos, filtro = "") {
    const list = document.getElementById("catalogo-list");
    if (!list) return;

    let filtrados = productos;
    if (filtro) {
        const f = filtro.toLowerCase();
        filtrados = productos.filter(p => p.titulo.toLowerCase().includes(f));
    }

    if (filtrados.length === 0) {
        list.innerHTML = `<p style="text-align:center; color:#888; width:100%;">No se encontraron productos.</p>`;
        return;
    }

    list.innerHTML = filtrados.map(p => `
        <div class="catalogo-card">
            <img src="${p.imagen}" alt="${p.titulo}" class="catalogo-img">
            <div class="catalogo-title">${p.titulo}</div>
            <div class="catalogo-section">${p.marca} - ${p.seccion}</div>
            <div class="catalogo-price">$${p.precio.toLocaleString('es-CO')}</div>
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
    // Wompi requiere el monto en centavos (ej: 50000 pesos -> 5000000 centavos)
    const montoCentavos = Math.round(precio * 100);
    const referencia = `MC-${Date.now()}`; 
    const moneda = "COP";
    const publicKey = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    try {
        // 1. Pedir la firma de integridad a Railway (Ruta que creamos en app.py)
        const response = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=${moneda}`);
        const data = await response.json();

        if (!data.firma) {
            console.error("Error del servidor:", data.error);
            alert("Error de seguridad: No se pudo generar la firma de pago. Verifica WOMPI_INTEGRITY_SECRET en Railway.");
            return;
        }

        // 2. Construir la URL completa de Wompi incluyendo la firma
        const urlWompi = `https://checkout.wompi.co/p/?` +
                         `public-key=${publicKey}` +
                         `&currency=${moneda}` +
                         `&amount-in-cents=${montoCentavos}` +
                         `&reference=${referencia}` +
                         `&signature=${data.firma}`;

        // 3. Redirigir al checkout seguro
        window.location.href = urlWompi;

    } catch (err) {
        console.error("Fallo en la conexión para el pago:", err);
        alert("Lo sentimos, hubo un problema al conectar con la pasarela de pagos.");
    }
}

// ============================================================
// === INICIALIZACIÓN GLOBAL ===
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
    // Cargar mensaje de cabecera
    await cargarMensajeCatalogo();
    
    // Cargar y mostrar productos
    const productos = await fetchProductos();
    renderProductos(productos);
    
    // Búsqueda en tiempo real
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            renderProductos(productos, e.target.value);
        });
    }

    // Cargar banners del slider
    try {
        const slidesRes = await fetch("/slides");
        const slidesData = await slidesRes.json();
        if(slidesData.length > 0) {
            renderSlidesDyn(slidesData);
        }
    } catch (err) {
        console.warn("No hay banners para mostrar.");
    }
});

// Función para inyectar banners en el slider
function renderSlidesDyn(slides) {
    const slider = document.getElementById("catalogo-slider");
    if (!slider) return;

    slider.innerHTML = `
        <button class="slider-arrow slider-arrow-left" aria-label="Anterior">&#10094;</button>
        <div class="slider-track"></div>
        <button class="slider-arrow slider-arrow-right" aria-label="Siguiente">&#10095;</button>
        <div class="slider-dots"></div>
    `;

    const track = slider.querySelector(".slider-track");
    const dotsContainer = slider.querySelector(".slider-dots");

    track.innerHTML = slides.map((s, i) => `
        <div class="slider-slide ${i === 0 ? 'active' : ''}">
            <img src="${s.imagen}" alt="${s.titulo}" class="slider-img">
            <div class="slider-content">
                <h2>${s.titulo}</h2>
                <p>${s.descripcion || ''}</p>
                ${s.boton_texto ? `<button class="slider-btn" onclick="window.location.href='${s.boton_url}'">${s.boton_texto}</button>` : ''}
            </div>
        </div>
    `).join("");

    dotsContainer.innerHTML = slides.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join("");

    inicializarSlider();
}
