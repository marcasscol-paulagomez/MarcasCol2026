// ================== Mostrar mensaje superior ==================
async function cargarMensajeCatalogo() {
    try {
        const res = await fetch('/mensaje/ultimo');
        const data = await res.json();
        const msgDiv = document.getElementById('mensaje-superior');
        if (data.mensaje) {
            msgDiv.textContent = data.mensaje;
            msgDiv.style.display = "block";
        } else {
            msgDiv.style.display = "none"; // Ocultar si no hay mensaje activo
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

    window.addEventListener("resize", () => {
        ajustarAnchos();
    });

    slides = Array.from(slider.querySelectorAll(".slider-slide"));
    ajustarAnchos();
    showSlide(0);
    auto();
}

// ============================
// === FETCH SECCIONES ========
// ============================
async function fetchSecciones() {
    const res = await fetch("/secciones");
    if (!res.ok) return [];
    return await res.json();
}

// ===========================
// === FETCH SLIDES ==========
// ===========================
async function fetchSlides() {
    const res = await fetch("/slides");
    if (!res.ok) return [];
    return await res.json();
}

function renderSlidesDyn(slides) {
    let slider = document.getElementById("catalogo-slider");
    if (!slider) return;

    slider.innerHTML = `
        <button class="slider-arrow slider-arrow-left" aria-label="Anterior">&#10094;</button>
        <div class="slider-track"></div>
        <button class="slider-arrow slider-arrow-right" aria-label="Siguiente">&#10095;</button>
        <div class="slider-dots"></div>
    `;

    const track = slider.querySelector(".slider-track");
    const dots = slider.querySelector(".slider-dots");
    if (!track || !dots) return;

    track.innerHTML = slides.map((slide, i) => {
        let imagen = slide.imagen?.trim() || "/uploads/placeholder.jpg";


        const titulo = slide.titulo?.trim() || "Sin título";
        const descripcion = slide.descripcion?.trim() || "Sin descripción";
        const marca = slide.marca?.trim() || "";

        return `
            <div class="slider-slide${i === 0 ? " active" : ""}">
                <div class="slider-bg" style="background-image:url('${imagen}')"></div>
                <div class="slider-content">
                    <h2>${titulo}</h2>
                    <p>${descripcion}</p>
                    ${marca ? `<div class="slider-brand">${marca}</div>` : ""}
                    ${slide.boton_texto
                        ? `<button class="slider-btn" onclick="window.open('${slide.boton_url || "#"}','_blank')">${slide.boton_texto}</button>`
                        : ""}
                </div>
                <img src="${imagen}" alt="${marca || titulo}" class="slider-img">
            </div>
        `;
    }).join("");

    dots.innerHTML = slides.map((_, i) =>
        `<span class="dot${i === 0 ? " active" : ""}"></span>`
    ).join("");

    inicializarSlider();
}

// ===========================
// === FETCH MARCAS ==========
// ===========================
async function fetchMarcas() {
    const res = await fetch("/marcas");
    if (!res.ok) return [];
    return await res.json();
}

// ==============================
// === PRODUCTOS DINÁMICOS ======
// ==============================
async function fetchProductos() {
    try {
        const res = await fetch("/products");
        if (!res.ok) return [];
        return await res.json();
    } catch (err) {
        console.error("Error cargando productos:", err);
        return [];
    }
}

// Normalizador para acentos, mayúsculas y espacios
function normalizarTexto(texto) {
    return (texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

function renderProductos(productos, seccion = null, filtro = "", marca = null) {
    const list = document.getElementById("catalogo-list");
    if (!list) return;

    let filtrados = productos;

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
        list.innerHTML = `<p style="text-align:center;color:#888;width:100vw;">No hay productos para mostrar.</p>`;
        return;
    }

    list.innerHTML = filtrados.map(p => `
        <div class="catalogo-card">
            <img src="${p.imagen}" alt="${p.titulo}" class="catalogo-img">
            <div class="catalogo-title">${p.titulo}</div>
            <div class="catalogo-section">${p.marca} - ${p.seccion}</div>
            <div class="catalogo-desc">${p.descripcion}</div>
            <div class="catalogo-price">$${p.precio}</div>
            <button class="catalogo-btn"
                onclick="comprarProducto(
                    '${p.titulo}', 
                    '${p.precio}', 
                    '${p.descripcion}', 
                    '${p.seccion}', 
                    '${p.marca}', 
                    '${p.imagen}'
                )">
                Comprar
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

    // Menú Secciones global
    let html = `
      <li class="has-submenu">
        <span aria-expanded="false">Secciones</span>
        <ul class="submenu">
          ${secciones.map(s => `
            <li>
              <span class="seccion-item" data-seccion="${s}">${s}</span>
            </li>
          `).join("")}
        </ul>
      </li>
    `;

    // Menú Marcas con sub-secciones
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
}

// ==========================
// === VARIABLES GLOBALES ===
// ==========================
let productosGlobal = [];
let seccionActual = null;
let marcaActual = null;

// ==========================
// === CARRITO LOCALSTORAGE =
// ==========================
function getCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function saveCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

function actualizarIconoCarrito() {
    const carrito = getCarrito();
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
        cartCount.textContent = `(${carrito.length})`;
    }
}

window.comprarProducto = function(titulo, precio, descripcion = "", seccion = "", marca = "", imagen = "") {
    let carrito = getCarrito();
    carrito.push({ titulo, precio, descripcion, seccion, marca, imagen });
    saveCarrito(carrito);
    actualizarIconoCarrito();
};

// ==========================
// === REDIRECCIÓN CARRITO ==
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    actualizarIconoCarrito();

    const btnCarrito = document.getElementById("btn-carrito");
    if (btnCarrito) {
        btnCarrito.addEventListener("click", () => {
            window.location.href = "carrito.html";
        });
    }
});

// ==========================
// === INICIALIZACIÓN =======
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
    await cargarMensajeCatalogo();
    await renderNavMenu();
    const slides = await fetchSlides();
    renderSlidesDyn(slides);
    productosGlobal = await fetchProductos();
    renderProductos(productosGlobal);

    // Búsqueda
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
        searchInput.addEventListener("input", function() {
            renderProductos(productosGlobal, seccionActual, this.value, marcaActual);
        });
    }

    // ============================
    // === MENÚ LATERAL MÓVIL ====
    // ============================
    const menuToggle = document.getElementById('menu-toggle');
    const catalogoNav = document.getElementById('catalogo-nav');
    const navOverlay = document.getElementById('nav-overlay');

    function openNav() {
        catalogoNav.classList.add('active');
        document.body.classList.add('nav-open');
        if (navOverlay) navOverlay.classList.add('active');
    }

    function closeNav() {
        catalogoNav.classList.remove('active');
        document.body.classList.remove('nav-open');
        if (navOverlay) navOverlay.classList.remove('active');

        // Cierra todos los submenús
        document.querySelectorAll('.has-submenu .submenu.show').forEach(open => {
            open.classList.remove('show');
            const tr = open.closest('.has-submenu')?.querySelector('span, a');
            if (tr) tr.setAttribute('aria-expanded','false');
        });
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            if (catalogoNav.classList.contains('active')) {
                closeNav();
            } else {
                openNav();
            }
        });
    }

    if (navOverlay) navOverlay.addEventListener('click', closeNav);

    // Acordeón móvil - Mejorado
    catalogoNav.addEventListener('click', function(e) {
        const trigger = e.target.closest('.has-submenu > span, .has-submenu > a');

        if (trigger && window.innerWidth <= 900) {
            e.preventDefault();
            e.stopPropagation();

            const parentLi = trigger.closest('.has-submenu');
            const submenu = parentLi?.querySelector('.submenu');
            
            if (submenu) {
                // Cerrar otros submenús del mismo nivel
                const parentUl = parentLi.parentElement;
                parentUl.querySelectorAll(':scope > .has-submenu > .submenu.show').forEach(open => {
                    if (open !== submenu) {
                        open.classList.remove('show');
                        const triggerEl = open.closest('.has-submenu')?.querySelector('span, a');
                        if (triggerEl) triggerEl.setAttribute('aria-expanded', 'false');
                    }
                });

                // Toggle del submenu actual
                const isOpen = submenu.classList.toggle('show');
                trigger.setAttribute('aria-expanded', String(isOpen));

                // Si es una marca y el submenu se abrió, cargar las secciones
                if (isOpen && parentLi.classList.contains('marca-con-submenu')) {
                    const marca = parentLi.dataset.marca;
                    const subSecciones = parentLi.querySelector('.sub-secciones');
                    
                    if (subSecciones && parentLi.dataset.loaded !== "true") {
                        fetch(`/marcas/${encodeURIComponent(marca)}/secciones`)
                            .then(res => res.json())
                            .then(secciones => {
                                subSecciones.innerHTML = secciones.map(s => `
                                    <li data-seccion="${s}">
                                        <span class="seccion-item" data-marca="${marca}" data-seccion="${s}">${s}</span>
                                    </li>
                                `).join("");
                                parentLi.dataset.loaded = "true";
                            })
                            .catch(err => console.error("Error cargando secciones:", err));
                    }
                }
            }
        }

        // Cerrar menú al clickear en un item (sección, marca o enlace)
        const itemClicked = e.target.closest('.seccion-item, a:not(.has-submenu > a)');
        if (itemClicked && window.innerWidth <= 900) {
            setTimeout(() => closeNav(), 150);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeNav();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeNav();
    });

    // ================================
    // === HOVER SECCIONES PC (Desktop) ===
    // ================================
    document.addEventListener("mouseover", async (e) => {
        if (window.innerWidth > 900) {
            // Detectar hover sobre .marca-item (el span)
            const marcaItem = e.target.closest(".marca-item");
            if (marcaItem) {
                const marcaLi = marcaItem.closest(".marca-con-submenu");
                if (marcaLi && marcaLi.dataset.loaded !== "true") {
                    const marca = marcaLi.dataset.marca;
                    const subSecciones = marcaLi.querySelector(".sub-secciones");

                    if (!subSecciones) return;

                    try {
                        const res = await fetch(`/marcas/${encodeURIComponent(marca)}/secciones`);
                        if (!res.ok) return;
                        const secciones = await res.json();

                        subSecciones.innerHTML = secciones.map(s => `
                            <li data-seccion="${s}">
                                <span class="seccion-item" data-marca="${marca}" data-seccion="${s}">${s}</span>
                            </li>
                        `).join("");

                        marcaLi.dataset.loaded = "true";
                    } catch (err) {
                        console.error("Error cargando secciones para marca:", marca, err);
                    }
                }
            }
        }
    });

    // ============================
    // === CLICK FILTROS ==========
    // ============================
    document.addEventListener("click", (e) => {
        // Filtrar por marca
        const marcaEl = e.target.closest(".marca-item");
        if (marcaEl) {
            e.preventDefault();
            const marca = marcaEl.dataset.marca;
            
            fetch(`/products/filter?marca=${encodeURIComponent(marca)}`)
                .then(res => res.json())
                .then(data => renderProductos(data))
                .catch(err => console.error("Error filtrando por marca:", err));
            
            // Cerrar navegación si está abierta en móvil
            if (window.innerWidth <= 900) {
                setTimeout(() => closeNav(), 100);
            }
            return;
        }

        // Filtrar por sección
        const secEl = e.target.closest(".seccion-item");
        if (secEl) {
            e.preventDefault();
            const marca = secEl.dataset.marca;
            const seccion = secEl.dataset.seccion;

            let url = `/products/filter?seccion=${encodeURIComponent(seccion)}`;
            if (marca) url += `&marca=${encodeURIComponent(marca)}`;

            fetch(url)
                .then(res => res.json())
                .then(data => renderProductos(data))
                .catch(err => console.error("Error filtrando por sección:", err));
            
            // Cerrar navegación si está abierta en móvil
            if (window.innerWidth <= 900) {
                setTimeout(() => closeNav(), 100);
            }
        }
    });
});
