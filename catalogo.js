// ==========================================================
// CONFIGURACIÓN DE CONEXIÓN DINÁMICA CON EL SERVIDOR RAILWAY
// ==========================================================
const BASE_URL = window.API_BASE || "";

// ================== Mostrar mensaje superior ==================
async function cargarMensajeCatalogo() {
    try {
        const res = await fetch(`${BASE_URL}/mensaje/ultimo`);
        const data = await res.json();
        const msgDiv = document.getElementById('mensaje-superior');
        if (msgDiv) {
            if (data.mensaje) {
                msgDiv.textContent = data.mensaje;
                msgDiv.style.display = "block";
            } else {
                msgDiv.style.display = "none";
            }
        }
    } catch (err) {
        console.error("No se pudo cargar el mensaje en catálogo:", err);
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
    const left = slider.querySelector(".slider-arrow-left");
    const right = slider.querySelector(".slider-arrow-right");

    if (!track || slides.length === 0) return;

    function ajustarAnchos() {
        const w = slider.clientWidth;
        slides.forEach(s => {
            s.style.width = `${w}px`;
            s.style.minWidth = `${w}px`;
            s.style.maxWidth = `${w}px`;
        });
        track.style.width = `${w * slides.length}px`;
        track.style.transform = `translateX(-${idx * w}px)`;
    }

    function showSlide(i) {
        if (!track) return;
        if (i < 0) i = slides.length - 1;
        if (i >= slides.length) i = 0;
        idx = i;

        const w = slider.clientWidth;
        track.style.transform = `translateX(-${i * w}px)`;

        slides.forEach((s, j) => s.classList.toggle("active", j === i));
        dots.forEach((d, j) => d.classList.toggle("active", j === i));
    }

    function next() { showSlide((idx + 1) % slides.length); }
    function prev() { showSlide((idx - 1 + slides.length) % slides.length); }

    function auto() {
        clearInterval(timer);
        if (slides.length > 1) timer = setInterval(next, 6000);
    }

    if (left) left.onclick = () => { prev(); auto(); };
    if (right) right.onclick = () => { next(); auto(); };

    dots.forEach((d, i) => d.onclick = () => { showSlide(i); auto(); });

    window.addEventListener("resize", ajustarAnchos);

    slides = Array.from(slider.querySelectorAll(".slider-slide"));
    ajustarAnchos();
    showSlide(0);
    auto();
}

// ============================
// === FETCH SECCIONES Y DATOS VIA API_BASE ========
// ============================
async function fetchSecciones() {
    const res = await fetch(`${BASE_URL}/secciones`);
    if (!res.ok) return [];
    return await res.json();
}

async function fetchSlides() {
    const res = await fetch(`${BASE_URL}/slides`);
    if (!res.ok) return [];
    return await res.json();
}

async function fetchMarcas() {
    const res = await fetch(`${BASE_URL}/marcas`);
    if (!res.ok) return [];
    return await res.json();
}

async function fetchProductos() {
    try {
        const res = await fetch(`${BASE_URL}/products`);
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error("Error cargando productos:", err);
        return [];
    }
}

function normalizarTexto(texto) {
    return (texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// ==========================================================
// RENDERIZADO AJUSTADO CON FILTRO AUTOMÁTICO DE DESTACADOS
// ==========================================================
function renderProductos(productos, seccion = null, filtro = "", marca = null) {
    const list = document.getElementById("catalogo-list");
    if (!list) return;

    let filtrados = productos;

    // Si la página carga limpia (sin clicks), forzamos a mostrar "Productos Destacados"
    if (!seccion && !filtro && !marca) {
        seccion = "Productos Destacados";
    }

    if (seccion) {
        filtrados = filtrados.filter(p =>
            normalizarTexto(p.seccion) === normalizarTexto(seccion)
        );
    }

    if (marca) {
        filtrados = filtrados.filter(p =>
            normalizarTexto(p.marca) === normalizarTexto(marca)
        );
    }

    if (filtro) {
        const f = normalizarTexto(filtro);
        filtrados = filtrados.filter(p =>
            normalizarTexto(p.titulo).includes(f) ||
            normalizarTexto(p.marca).includes(f) ||
            normalizarTexto(p.seccion).includes(f)
        );
    }

    if (!filtrados.length) {
        list.innerHTML = `<p style="text-align:center;color:#888;width:100%;grid-column: 1 / -1;padding:40px 0;font-family:'Poppins',sans-serif;">No hay productos cargados en esta categoría actualmente.</p>`;
        return;
    }

    list.innerHTML = filtrados.map(p => `
        <div class="catalogo-card">
            <img src="${p.imagen}" alt="${p.titulo}" class="catalogo-img">
            <div>
                <div class="catalogo-section">${p.marca}</div>
                <div class="catalogo-title">${p.titulo}</div>
                <div class="catalogo-desc">${p.descripcion ? p.descripcion.substring(0, 85) + '...' : ''}</div>
                <div class="catalogo-price">$${parseFloat(p.precio).toLocaleString('es-CO')}</div>
            </div>
            <button class="catalogo-btn"
                onclick="comprarProducto('${p.titulo}', '${p.precio}', '${p.descripcion || ""}', '${p.seccion}', '${p.marca}', '${p.imagen}')">
                Agregar al carrito
            </button>                    
        </div>
    `).join("");
}

// ==========================
// === NAV MENÚ DINÁMICO ====
// ==========================
async function renderNavMenu() {
    const secciones = await fetchSecciones();
    const marcas = await fetchMarcas();

    const nav = document.getElementById("catalogo-secciones");
    if (!nav) return;

    let html = `
      <li class="has-submenu">
        <span aria-expanded="false">Secciones</span>
        <ul class="submenu">
          ${secciones.map(s => `
            <li><span class="seccion-item" data-seccion="${s}">${s}</span></li>
          `).join("")}
        </ul>
      </li>
    `;

    html += `
      <li class="has-submenu">
        <span aria-expanded="false">Marcas</span>
        <ul class="submenu">
          ${marcas.map(m => `
            <li class="has-submenu marca-con-submenu" data-marca="${m.nombre}" data-loaded="false">
              <span class="marca-item" data-marca="${m.nombre}" aria-expanded="false">${m.nombre}</span>
              <ul class="submenu sub-secciones"></ul>
            </li>
          `).join("")}
        </ul>
      </li>
    `;

    nav.innerHTML = html;

    const marcasHome = document.getElementById("catalogo-marcas");
    if (marcasHome && marcas.length > 0) {
        marcasHome.innerHTML = marcas.map(m => `
            <div class="marca-item-burbuja" data-marca="${m.nombre}" style="cursor:pointer; text-align:center;">
                <img src="${m.imagen || 'imagenes/logo.jpg'}" alt="${m.nombre}" style="width:80px; height:80px; object-fit:cover; border-radius:50%; border:2px solid #eee; margin-bottom:8px;">
                <div style="font-size:0.85rem; font-weight:600; color:#2d2d6d;">${m.nombre}</div>
            </div>
        `).join("");
    }
}

// ==========================================================
// PROCESO DE INICIALIZACIÓN DE LA HOME AL CARGAR LA PÁGINA
// ==========================================================
let productosGlobales = [];

async function inicializarTienda() {
    await cargarMensajeCatalogo();
    await renderNavMenu();
    
    // Traemos los banners dinámicos
    const slides = await fetchSlides();
    if (slides.length > 0) renderSlidesDyn(slides);

    // Traemos todos los productos desde Railway y los cargamos en la Home
    productosGlobales = await fetchProductos();
    renderProductos(productosGlobales); // Renderizado inicial (Destacados automáticos)
}

// Escuchamos la carga completa del HTML para disparar la tienda
window.addEventListener('DOMContentLoaded', inicializarTienda);
