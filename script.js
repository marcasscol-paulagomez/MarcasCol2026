// ==========================================================
// CONFIGURACIÓN BASE DE RED - MARCAS COL
// ==========================================================
window.API_BASE = 
  "https://marcasscol-backend-production.up.railway.app";

// ================= Poblar selects dinámicos =================

async function poblarSelectMarcas() {
    const select = document.getElementById('product-marca');
    if (!select) return;
    try {
        const res = await fetch(
            `${window.API_BASE}/marcas`
        );
        if (!res.ok) return;
        const marcas = await res.json();
        select.innerHTML = 
          '<option value="">Selecciona una marca</option>';
        marcas.forEach(marca => {
            const opt = document.createElement('option');
            opt.value = marca.nombre;
            opt.textContent = marca.nombre;
            select.appendChild(opt);
        });
    } catch { /* ignorar */ }
}

async function poblarSelectSecciones() {
    const select = document.getElementById('product-seccion');
    if (!select) return;
    try {
        const res = await fetch(
            `${window.API_BASE}/secciones`
        );
        if (!res.ok) return;
        const secciones = await res.json();
        select.innerHTML = 
          '<option value="">Selecciona una sección</option>';
        secciones.forEach(sec => {
            const opt = document.createElement('option');
            opt.value = sec;
            opt.textContent = sec;
            select.appendChild(opt);
        });
    } catch { /* ignorar */ }
}

// ================= Gestión de Eliminación =================

async function listarYBorrarSecciones() {
    const listaDiv = document.getElementById(
        'lista-secciones-admin'
    );
    if (!listaDiv) return;
    try {
        const res = await fetch(
            `${window.API_BASE}/secciones`
        );
        const secciones = await res.json();
        listaDiv.innerHTML = 
          '<h4 style="margin:15px 0 10px 0; ' +
          'color:#333;">Secciones actuales:</h4>';
        secciones.forEach(sec => {
            listaDiv.innerHTML += `
                <div style="display:flex; 
                            justify-content:space-between; 
                            align-items:center; 
                            background:#f9f9f9; 
                            padding:8px 12px; 
                            margin-bottom:5px; 
                            border:1px solid #eee; 
                            border-radius:4px;">
                    <span style="font-weight:500;">${sec}</span>
                    <button onclick="eliminarSeccion('${sec}')" 
                            style="background:#e74c3c; 
                                   color:white; 
                                   border:none; 
                                   padding:4px 8px; 
                                   border-radius:3px; 
                                   cursor:pointer; 
                                   font-size:0.8rem;">❌ Eliminar</button>
                </div>`;
        });
    } catch (e) { 
        console.error("Error listando secciones", e); 
    }
}

async function listarYBorrarMarcas() {
    const listaDiv = document.getElementById(
        'lista-marcas-admin'
    );
    if (!listaDiv) return;
    try {
        const res = await fetch(
            `${window.API_BASE}/marcas`
        );
        const marcas = await res.json();
        listaDiv.innerHTML = 
          '<h4 style="margin:15px 0 10px 0; ' +
          'color:#333;">Marcas actuales:</h4>';
        marcas.forEach(m => {
            listaDiv.innerHTML += `
                <div style="display:flex; 
                            justify-content:space-between; 
                            align-items:center; 
                            background:#f9f9f9; 
                            padding:8px 12px; 
                            margin-bottom:5px; 
                            border:1px solid #eee; 
                            border-radius:4px;">
                    <span style="font-weight:500;">${m.nombre}</span>
                    <button onclick="eliminarMarca('${m.nombre}')" 
                            style="background:#e74c3c; 
                                   color:white; 
                                   border:none; 
                                   padding:4px 8px; 
                                   border-radius:3px; 
                                   cursor:pointer; 
                                   font-size:0.8rem;">❌ Eliminar</button>
                </div>`;
        });
    } catch (e) { 
        console.error("Error listando marcas", e); 
    }
}

async function eliminarSeccion(nombre) {
    if (!confirm(`¿Eliminar sección "${nombre}"?`)) return;
    const url = 
      `${window.API_BASE}/secciones/${encodeURIComponent(nombre)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) { 
        alert("Sección eliminada"); 
        await poblarSelectSecciones(); 
        await listarYBorrarSecciones(); 
    } else { 
        alert("No se pudo eliminar. Revisa si hay productos usándola."); 
    }
}

async function eliminarMarca(nombre) {
    if (!confirm(`¿Eliminar marca "${nombre}"?`)) return;
    const url = 
      `${window.API_BASE}/marcas/${encodeURIComponent(nombre)}`;
    const res = await fetch(url, { method: 'DELETE' });
    if (res.ok) { 
        alert("Marca eliminada"); 
        await poblarSelectMarcas(); 
        await listarYBorrarMarcas(); 
    } else { 
        alert("No se pudo eliminar."); 
    }
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
            document.getElementById('products-list')
                .scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (btnBanners) {
        btnBanners.addEventListener('click', async () => {
            await fetchAndRenderBanners();
            document.getElementById('banners-list')
                .scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            await fetchAndRenderProducts();
            await fetchAndRenderBanners();
            await listarYBorrarSecciones();
            await listarYBorrarMarcas();
        });
    }

    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await fetch(`${window.API_BASE}/owner-logout`, { 
                    method: 'POST', 
                    credentials: 'include' 
                });
            } catch (err) { 
                console.warn('Error during logout', err); 
            }
            window.location.reload();
        });
    }
}

// ================= Formularios (POST) =================

document.getElementById('formulario-marca').onsubmit = async function(e) {
    e.preventDefault();
    const nombre = document.getElementById('marca-nombre').value.trim();
    const imagenInput = document.getElementById('marca-imagen');
    const error = document.getElementById('marca-error');
    error.textContent = '';
    if (!nombre) return error.textContent = 'Nombre requerido';

    const formData = new FormData();
    formData.append('nombre', nombre);
    if (imagenInput.files[0]) {
        formData.append('imagen', imagenInput.files[0]);
    }

    const res = await fetch(`${window.API_BASE}/marcas`, { 
        method: 'POST', 
        body: formData 
    });
    const data = await res.json();
    if (!res.ok) error
