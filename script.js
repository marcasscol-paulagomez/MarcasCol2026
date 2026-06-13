// ==========================================================
// CONFIGURACIÓN DE CONEXIÓN DINÁMICA CON EL SERVIDOR RAILWAY
// ==========================================================
const BASE_URL = window.API_BASE || "https://marcasscol-backend-production.up.railway.app";

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
                await fetch(`${BASE_URL}/owner-logout`, { method: 'POST' });
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
