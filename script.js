// ================= Poblar selects dinámicos =================

async function poblarSelectMarcas() {
    const select = document.getElementById('product-marca');
    if (!select) return;
    try {
        const res = await fetch('/marcas');
        if (!res.ok) return;
        const marcas = await res.json();
        select.innerHTML = '<option value="">Selecciona una marca</option>';
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
        const res = await fetch('/secciones');
        if (!res.ok) return;
        const secciones = await res.json();
        select.innerHTML = '<option value="">Selecciona una sección</option>';
        secciones.forEach(sec => {
            const opt = document.createElement('option');
            opt.value = sec;
            opt.textContent = sec;
            select.appendChild(opt);
        });
    } catch { /* ignorar */ }
}

// ================= Gestión de Eliminación (NUEVO) =================

async function listarYBorrarSecciones() {
    const listaDiv = document.getElementById('lista-secciones-admin');
    if (!listaDiv) return;
    try {
        const res = await fetch('/secciones');
        const secciones = await res.json();
        listaDiv.innerHTML = '<h4 style="margin: 15px 0 10px 0; color: #333;">Secciones actuales (Click para borrar):</h4>';
        secciones.forEach(sec => {
            listaDiv.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; padding:8px 12px; margin-bottom:5px; border:1px solid #eee; border-radius:4px;">
                    <span style="font-weight:500;">${sec}</span>
                    <button onclick="eliminarSeccion('${sec}')" style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.8rem;">❌ Eliminar</button>
                </div>`;
        });
    } catch (e) { console.error("Error listando secciones", e); }
}

async function listarYBorrarMarcas() {
    const listaDiv = document.getElementById('lista-marcas-admin');
    if (!listaDiv) return;
    try {
        const res = await fetch('/marcas');
        const marcas = await res.json();
        listaDiv.innerHTML = '<h4 style="margin: 15px 0 10px 0; color: #333;">Marcas actuales (Click para borrar):</h4>';
        marcas.forEach(m => {
            listaDiv.innerHTML += `
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f9f9f9; padding:8px 12px; margin-bottom:5px; border:1px solid #eee; border-radius:4px;">
                    <span style="font-weight:500;">${m.nombre}</span>
                    <button onclick="eliminarMarca('${m.nombre}')" style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer; font-size:0.8rem;">❌ Eliminar</button>
                </div>`;
        });
    } catch (e) { console.error("Error listando marcas", e); }
}

async function eliminarSeccion(nombre) {
    if (!confirm(`¿Estás segura de eliminar la sección "${nombre}"?`)) return;
    const res = await fetch(`/secciones/${encodeURIComponent(nombre)}`, { method: 'DELETE' });
    if (res.ok) { 
        alert("Sección eliminada"); 
        await poblarSelectSecciones(); 
        await listarYBorrarSecciones(); 
    } else { alert("No se pudo eliminar. Revisa si hay productos usándola."); }
}

async function eliminarMarca(nombre) {
    if (!confirm(`¿Estás segura de eliminar la marca "${nombre}"?`)) return;
    const res = await fetch(`/marcas/${encodeURIComponent(nombre)}`, { method: 'DELETE' });
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
            document.getElementById('products-list').scrollIntoView({ behavior: 'smooth' });
        });
    }
    if (btnBanners) {
        btnBanners.addEventListener('click', async () => {
            await fetchAndRenderBanners();
            document.getElementById('banners-list').scrollIntoView({ behavior: 'smooth' });
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
                await fetch('/owner-logout', { method: 'POST', credentials: 'include' });
            } catch (err) { console.warn('Error during logout', err); }
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
    if (imagenInput.files[0]) formData.append('imagen', imagenInput.files[0]);

    const res = await fetch('/marcas', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) error.textContent = data.error || 'Error';
    else {
        error.textContent = '¡Marca agregada!';
        await poblarSelectMarcas();
        await listarYBorrarMarcas();
        document.getElementById('formulario-marca').reset();
        setTimeout(() => { error.textContent = ''; }, 1200);
    }
};

document.getElementById('seccion-form').onsubmit = async function(e) {
    e.preventDefault();
    const nombre = document.getElementById('seccion-nombre').value.trim();
    const error = document.getElementById('seccion-error');
    error.textContent = '';
    if (!nombre) return error.textContent = 'Nombre requerido';

    const res = await fetch('/secciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    });

    const data = await res.json();
    if (!res.ok) error.textContent = data.error || 'Error';
    else {
        error.textContent = '¡Sección agregada!';
        await poblarSelectSecciones();
        await listarYBorrarSecciones();
        document.getElementById('seccion-nombre').value = '';
        setTimeout(() => { error.textContent = ''; }, 1200);
    }
};

// ================= Login Propietario =================

document.getElementById('owner-login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const code = document.getElementById('owner-code').value;
    const res = await fetch('/owner-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        credentials: 'include'
    });

    let data = {};
    try { data = await res.json(); } catch (err) { }

    if (res.ok) {
        document.getElementById('login-error').textContent = '';
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('admin-dyn-container').style.display = 'block';
        setupAdminControls();
        await fetchAndRenderProducts();
    } else {
        document.getElementById('login-error').textContent = data.error || 'Código incorrecto';
    }
});

// ================= Resto de Funciones (Productos, Banners, Mensajes) =================

document.getElementById('product-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('titulo', document.getElementById('product-titulo').value);
    formData.append('descripcion', document.getElementById('product-descripcion').value);
    formData.append('seccion', document.getElementById('product-seccion').value);
    formData.append('marca', document.getElementById('product-marca').value);
    formData.append('precio', document.getElementById('product-precio').value);
    formData.append('imagen', document.getElementById('product-imagen').files[0]);

    const res = await fetch('/product', { method: 'POST', body: formData, credentials: 'include' });
    if (res.ok) {
        alert('Producto guardado exitosamente');
        document.getElementById('product-form').reset();
        await fetchAndRenderProducts();
    } else {
        alert('Error al guardar producto');
    }
});

async function fetchAndRenderProducts() {
    const res = await fetch('/products', { credentials: 'include' });
    if (!res.ok) return;
    const products = await res.json();
    const list = document.getElementById('products-list');
    if (!products.length) {
        list.innerHTML = '<p class="no-products">No hay productos publicados.</p>';
        return;
    }
    list.innerHTML = products.map(p => `
        <div class="producto-item">
            <img src="${p.imagen}" alt="${p.titulo}" class="producto-imagen">
            <div class="producto-info">
                <div class="producto-titulo">${p.titulo} <span class="product-section">(${p.seccion})</span></div>
                <div class="producto-descripcion">${p.descripcion}</div>
                <div class="producto-precio">$${p.precio}</div>
            </div>
            <button class="btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar Producto</button>
        </div>
    `).join('');
}

async function eliminarProducto(id) {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/product/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { alert("Producto eliminado"); await fetchAndRenderProducts(); }
}

// Banners, Mensajes y Carga Inicial
window.addEventListener('DOMContentLoaded', () => {
    poblarSelectMarcas();
    poblarSelectSecciones();
    cargarMensajeActivo();
});

async function cargarMensajeActivo() {
    try {
        const res = await fetch('/mensaje/ultimo');
        const data = await res.json();
        if (data.mensaje) {
            const msgDiv = document.getElementById('mensaje-global');
            if (msgDiv) { msgDiv.textContent = data.mensaje; msgDiv.style.display = "block"; }
        }
    } catch (err) { console.error("No se pudo cargar el mensaje:", err); }
}

// (Otras funciones de Banner y Mensaje se mantienen igual según tu código previo)
