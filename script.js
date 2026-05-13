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
    } catch (e) { console.error("Error al poblar marcas:", e); }
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
    } catch (e) { console.error("Error al poblar secciones:", e); }
}

// ================= Gestión de Visualización y Eliminación de Listas =================

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
            await poblarSelectMarcas();
            await poblarSelectSecciones();
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

document.getElementById('formulario-banner').onsubmit = async function(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('titulo', document.getElementById('banner-titulo').value.trim());
    formData.append('descripcion', document.getElementById('banner-descripcion').value.trim());
    formData.append('marca', document.getElementById('banner-marca').value.trim());
    formData.append('imagen', document.getElementById('banner-imagen').files[0]);
    formData.append('boton_texto', document.getElementById('banner-boton-texto').value.trim());
    formData.append('boton_url', document.getElementById('banner-boton-url').value.trim());

    const res = await fetch('/slides', { method: 'POST', body: formData });
    if (res.ok) {
        alert('¡Banner agregado!');
        document.getElementById('formulario-banner').reset();
        await fetchAndRenderBanners();
    } else {
        alert('Error al agregar banner');
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

// ================= Guardar producto =================

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

// ================= Renderizado de Listas (Productos y Banners) =================

async function fetchAndRenderProducts() {
    const res = await fetch('/products', { credentials: 'include' });
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
    const res = await fetch('/slides', { credentials: 'include' });
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
    const res = await fetch(`/product/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { alert("Producto eliminado"); await fetchAndRenderProducts(); }
}

async function eliminarBanner(id) {
    if (!confirm("¿Eliminar este banner?")) return;
    const res = await fetch(`/slides/${id}`, { method: 'DELETE', credentials: 'include' });
    if (res.ok) { alert("Banner eliminado"); await fetchAndRenderBanners(); }
}

// ================= Carga Inicial =================

window.addEventListener('DOMContentLoaded', () => {
    poblarSelectMarcas();
    poblarSelectSecciones();
    cargarMensajeActivo();
});

async function cargarMensajeActivo() {
    try {
        const res = await fetch('/mensaje/ultimo');
        const data = await res.json();
        const msgDiv = document.getElementById('mensaje-global');
        if (data.mensaje && msgDiv) {
            msgDiv.textContent = data.mensaje;
            msgDiv.style.display = "block";
        }
    } catch (err) { console.error("No se pudo cargar el mensaje:", err); }
}

document.getElementById('mensaje-form').onsubmit = async (e) => {
    e.preventDefault();
    const texto = document.getElementById('mensaje-texto').value.trim();
    const res = await fetch('/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto })
    });
    if (res.ok) {
        alert('Mensaje guardado');
        document.getElementById('mensaje-form').reset();
        cargarMensajeActivo();
    }
};
