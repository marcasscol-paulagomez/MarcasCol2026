// ==========================================================
// CONFIGURACIÓN DE CONEXIÓN DINÁMICA CON EL SERVIDOR RAILWAY
// ==========================================================
const BASE_URL = window.API_BASE || "";

// ================= Poblar selects dinámicos =================

async function poblarSelectMarcas() {
    const select = document.getElementById('product-marca');
    if (!select) return;
    try {
        const res = await fetch(`${BASE_URL}/marcas`);
        if (!res.ok) return;
        const marcas = await res.json();
        select.innerHTML = '<option value="">Selecciona una marca</option>';
        marcas.forEach(marca => {
            const opt = document.createElement('option');
            opt.value = marca.nombre;
            opt.textContent = marca.nombre;
            select.appendChild(opt);
        });
    } catch (e) { console.error("Error al poblar marcas:", e); }
}

async function poblarSelectSecciones() {
    const select = document.getElementById('product-seccion');
    if (!select) return;
    try {
        const res = await fetch(`${BASE_URL}/secciones`);
        if (!res.ok) return;
        const secciones = await res.json();
        select.innerHTML = '<option value="">Selecciona una sección</option>';
        secciones.forEach(sec => {
            const opt = document.createElement('option');
            opt.value = sec;
            opt.textContent = sec;
            select.appendChild(opt);
        });
    } catch (e) { console.error("Error al poblar secciones:", e); }
}

// ================= Gestión de Visualización y Eliminación de Listas =================

async function listarYBorrarSecciones() {
    const listDiv = document.getElementById('lista-secciones-admin');
    if (!listDiv) return;
    try {
        const res = await fetch(`${BASE_URL}/secciones`);
        const secciones = await res.json();
        listDiv.innerHTML = '<h4 style="margin: 15px 0 10px 0; color: #333;">Secciones actuales (Click para borrar):</h4>';
        secciones.forEach(sec => {
            listDiv.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; padding:8px 12px; margin-bottom:5px; border:1px solid #eee; border-radius:4px;">
                    <span style="font-weight:500;">${sec}</span>
                    <button onclick="eliminarSeccion('${sec}')" style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.8rem;">❌ Eliminar</button>
                </div>`;
        });
    } catch (e) { console.error("Error listando secciones", e); }
}

async function listarYBorrarMarcas() {
    const listDiv = document.getElementById('lista-marcas-admin');
    if (!listDiv) return;
    try {
        const res = await fetch(`${BASE_URL}/marcas`);
        const marcas = await res.json();
        listDiv.innerHTML = '<h4 style="margin: 15px 0 10px 0; color: #333;">Marcas actuales (Click para borrar):</h4>';
        marcas.forEach(m => {
            listDiv.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; padding:8px 12px; margin-bottom:5px; border:1px solid #eee; border-radius:4px;">
                    <span style="font-weight:500;">${m.nombre}</span>
                    <button onclick="eliminarMarca('${m.nombre}')" style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.8rem;">❌ Eliminar</button>
                </div>`;
        });
    } catch (e) { console.error("Error listando marcas", e); }
}

async function eliminarSeccion(nombre) {
    if (!confirm(`¿Estás segura de eliminar la sección "${nombre}"?`)) return;
    const res = await fetch(`${BASE_URL}/secciones/${encodeURIComponent(nombre)}`, { method: 'DELETE' });
    if (res.ok) { 
        alert("Sección eliminada"); 
        await poblarSelectSecciones(); 
        await listarYBorrarSecciones(); 
    } else { alert("No se pudo eliminar. Revisa si hay productos usándola."); }
}

async function eliminarMarca(nombre) {
    if (!confirm(`¿Estás segura de eliminar la marca "${nombre}"?`)) return;
    const res = await fetch(`${BASE_URL}/marcas/${encodeURIComponent(nombre)}`, { method: 'DELETE' });
    if (res.ok) { 
        alert("Marca eliminada"); 
        await poblarSelectMarcas(); 
        await listarYBorrarMarcas(); 
    } else { alert("No se pudo eliminar."); }
}

// ================= Configuración Panel Admin =================

function setupAdminControls() {
    const controls = document.getElementById('admin-controls');
    if (controls) controls.style.display = 'flex';

    listarYBorrarSecciones();
    listarYBorrarMarcas();

    const btnProducts = document.getElementById('btn-show-products');
    const btnBanners = document.getElementById('btn-show-banners');
    const btnRefresh = document.getElementById('btn-refresh-lists');

    if (btnProducts) {
        btnProducts.addEventListener('click', async () => {
            await fetchAndRenderProducts();
            const pList = document.getElementById('products-list');
            if (pList) pList.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (btnBanners) {
        btnBanners.addEventListener('click', async () => {
            await fetchAndRenderBanners();
            const bList = document.getElementById('banners-list');
            if (bList) bList.scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            await fetchAndRenderProducts();
            await fetchAndRenderBanners();
            await listarYBorrarSecciones();
            await listarYBorrarMarcas();
            await poblarSelectMarcas();
            await poblarSelectSecciones();
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await fetch(`${BASE_URL}/owner-logout`, { method: 'POST', credentials: 'include' });
            } catch (err) { console.warn('Error during logout', err); }
            window.location.reload();
        });
    }
}

// ================= Formularios (POST) =================

const formMarca = document.getElementById('formulario-marca');
if (formMarca) {
    formMarca.onsubmit = async function(e) {
        e.preventDefault();
        const nombre = document.getElementById('marca-nombre').value.trim();
        const imagenInput = document.getElementById('marca-imagen');
        const error = document.getElementById('marca-error');
        if (error) error.textContent = '';
        if (!nombre) return error ? error.textContent = 'Nombre requerido' : false;

        const formData = new FormData();
        formData.append('nombre', nombre);
        if (imagenInput && imagenInput.files[0]) formData.append('imagen', imagenInput.files[0]);

        const res = await fetch(`${BASE_URL}/marcas`, { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) {
            if (error) error.textContent = data.error || 'Error';
        } else {
            if (error) error.textContent = '¡Marca agregada!';
            await poblarSelectMarcas();
            await listarYBorrarMarcas();
            formMarca.reset();
            setTimeout(() => { if (error) error.textContent = ''; }, 1200);
        }
    };
}

const formSeccion = document.getElementById('seccion-form');
if (formSeccion) {
    formSeccion.onsubmit = async function(e) {
        e.preventDefault();
        const nombre = document.getElementById('seccion-nombre').value.trim();
        const error = document.getElementById('seccion-error');
        if (error) error.textContent = '';
        if (!nombre) return error ? error.textContent = 'Nombre requerido' : false;

        const res = await fetch(`${BASE_URL}/secciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });

        const data = await res.json();
        if (!res.ok) {
            if (error) error.textContent = data.error || 'Error';
        } else {
            if (error) error.textContent = '¡Sección agregada!';
            await poblarSelectSecciones();
            await listarYBorrarSecciones();
            document.getElementById('seccion-nombre').value = '';
            setTimeout(() => { if (error) error.textContent = ''; }, 1200);
        }
    };
}

const formBanner = document.getElementById('formulario-banner');
if (formBanner) {
    formBanner.onsubmit = async function(e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('titulo', document.getElementById('banner-titulo').value.trim());
        formData.append('descripcion', document.getElementById('banner-descripcion').value.trim());
        formData.append('marca', document.getElementById('banner-marca').value.trim());
        formData.append('imagen', document.getElementById('banner-imagen').files[0]);
        formData.append('boton_texto', document.getElementById('banner-boton-texto').value.trim());
        formData.append('boton_url', document.getElementById('banner-boton-url').value.trim());

        const res = await fetch(`${BASE_URL}/slides`, { method: 'POST', body: formData });
        if (res.ok) {
            alert('¡Banner agregado!');
            formBanner.reset();
            await fetchAndRenderBanners();
        } else {
            alert('Error al agregar banner');
        }
    };
}

// ================= Login Propietario =================

const formLogin = document.getElementById('owner-login-form');
if (formLogin) {
    formLogin.addEventListener('submit', async function(e) {
        e.preventDefault();
        const code = document.getElementById('owner-code').value;
        const res = await fetch(`${BASE_URL}/owner-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
            credentials: 'include'
        });

        let data = {};
        try { data = await res.json(); } catch (err) { }

        const errDiv = document.getElementById('login-error');
        if (res.ok) {
            if (errDiv) errDiv.textContent = '';
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('admin-dyn-container').style.display = 'block';
            setupAdminControls();
            await fetchAndRenderProducts();
        } else {
            if (errDiv) errDiv.textContent = data.error || 'Código incorrecto';
        }
    });
}

// ================= Guardar producto =================

const formProduct = document.getElementById('product-form');
if (formProduct) {
    formProduct.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData();
        formData.append('titulo', document.getElementById('product-titulo').value);
        formData.append('descripcion', document.getElementById('product-descripcion').value);
        formData.append('seccion', document.getElementById('product-seccion').value);
        formData.append('marca', document.getElementById('product-marca').value);
        formData.append('precio', document.getElementById('product-precio').value);
        formData.append('imagen', document.getElementById('product-imagen').files[0]);

        const res = await fetch(`${BASE_URL}/product`, { method: 'POST', body: formData, credentials: 'include' });
        if (res.ok) {
            alert('Producto guardado exitosamente');
            formProduct.reset();
            await fetchAndRenderProducts();
        } else {
            alert('Error al guardar producto');
        }
    });
}

// ================= Renderizado de Listas (Productos y Banners) =================

async function fetchAndRenderProducts() {
    const res = await fetch(`${BASE_URL}/products`, { credentials: 'include' });
    if (!res.ok) return;
    const products = await res.json();
    const list = document.getElementById('products-list');
    if (!list) return;
    if (!products.length) {
        list.innerHTML = '<p class="no-products" style="text-align:center; padding:20px;">No hay productos publicados.</p>';
        return;
    }
    list.innerHTML = products.map(p => `
        <div class="producto-item" style="border:1px solid #ddd; padding:10px; margin-bottom:10px; display:flex; align-items:center; border-radius:8px;">
            <img src="${p.imagen}" alt="${p.titulo}" style="width:70px; height:70px; object-fit:cover; margin-right:15px; border-radius:5px;">
            <div style="flex:1;">
                <div style="font-weight:bold;">${p.titulo} <span style="font-size:0.8rem; color:#666;">(${p.seccion})</span></div>
                <div style="font-size:0.9rem;">$${p.precio}</div>
            </div>
            <button class="btn-eliminar" onclick="eliminarProducto(${p.id})" style="background:#e74c3c; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Eliminar</button>
        </div>
    `).join('');
}

async function fetchAndRenderBanners() {
    const res = await fetch(`${BASE_URL}/slides`, { credentials: 'include' });
    if (!res.ok) return;
    const slides = await res.json();
    const container = document.getElementById('banners-list');
    if (!container) return;
    if (!slides.length) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">No hay banners publicados.</p>';
        return;
    }
    container.innerHTML = slides.map(s => `
        <div class="banner-item" style="border:1px solid #ddd; padding:10px; margin-bottom:10px; display:flex; align-items:center; border-radius:8px;">
            <img src="${s.imagen}" style="width:100px; height:50px; object-fit:cover; margin-right:15px; border-radius:5px;">
            <div style="flex:1;">
                <div style="font-weight:bold;">${s.titulo}</div>
                <div style="font-size:0.8rem; color:#666;">${s.marca}</div>
            </div>
            <button class="btn-eliminar" onclick="eliminarBanner(${s.id})" style="background:#e74c3c; color:white; border:none; padding:8px; border-radius:5px; cursor:pointer;">Eliminar</button>
        </div>
    `).join('');
}

async function eliminarProducto(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`${BASE_URL}/product/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { alert("Producto eliminado"); await fetchAndRenderProducts(); }
}

async function eliminarBanner(id) {
    if (!confirm("¿Eliminar este banner?")) return;
    const res = await fetch(`${BASE_URL}/slides/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { alert("Banner eliminado"); await fetchAndRenderBanners(); }
}

// ================= Carga Inicial Protegida =================

window.addEventListener('DOMContentLoaded', () => {
    poblarSelectMarcas();
    poblarSelectSecciones();
    cargarMensajeActivo();
});

async function cargarMensajeActivo() {
    try {
        const res = await fetch(`${BASE_URL}/mensaje/ultimo`);
        const data = await res.json();
        const msgDiv = document.getElementById('mensaje-global') || document.getElementById('mensaje-superior');
        if (data.mensaje && msgDiv) {
            msgDiv.textContent = data.mensaje;
            msgDiv.style.display = "block";
        }
    } catch (err) { console.error("No se pudo cargar el mensaje:", err); }
}

const formMensaje = document.getElementById('mensaje-form');
if (formMensaje) {
    formMensaje.onsubmit = async (e) => {
        e.preventDefault();
        const texto = document.getElementById('mensaje-texto').value.trim();
        const res = await fetch(`${BASE_URL}/mensajes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            style: 'credentials: "include"',
            body: JSON.stringify({ texto })
        });
        if (res.ok) {
            alert('Mensaje guardado');
            formMensaje.reset();
            cargarMensajeActivo();
        }
    };
}
