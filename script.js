// ================= CONTRASEÑA MAESTRA PARA VERCEL =================
const CODIGO_MAESTRO = "1234"; // <--- CAMBIA ESTE CÓDIGO POR EL QUE TU QUIERAS

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
    } catch { /* ignorar si falla el servidor */ }
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
    } catch { /* ignorar si falla el servidor */ }
}

window.addEventListener('DOMContentLoaded', () => {
    poblarSelectMarcas();
    poblarSelectSecciones();
    cargarMensajeActivo();
    
    // Si ya habías iniciado sesión antes, mantenerla
    if(localStorage.getItem('isOwner') === 'true') {
        mostrarPanelAdmin();
    }
});

function mostrarPanelAdmin() {
    document.getElementById('login-container').style.display = 'none';
    document.getElementById('admin-dyn-container').style.display = 'block';
    setupAdminControls();
    fetchAndRenderProducts();
    fetchAndRenderBanners();
}

function setupAdminControls() {
    const controls = document.getElementById('admin-controls');
    if (controls) controls.style.display = 'flex';

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
        });
    }
    
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            localStorage.removeItem('isOwner');
            window.location.reload();
        });
    }
}

// ================= LOGIN CON CONTRASEÑA MAESTRA =================
document.getElementById('owner-login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const code = document.getElementById('owner-code').value;

    // Primero intentamos con el código maestro (Solución para Vercel)
    if (code === CODIGO_MAESTRO) {
        localStorage.setItem('isOwner', 'true');
        mostrarPanelAdmin();
        return;
    }

    // Si no es el maestro, intenta contactar al servidor original (Koyeb/Otros)
    try {
        const res = await fetch('/owner-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
            credentials: 'include'
        });

        if (res.ok) {
            localStorage.setItem('isOwner', 'true');
            mostrarPanelAdmin();
        } else {
            document.getElementById('login-error').textContent = 'Código incorrecto';
        }
    } catch (err) {
        document.getElementById('login-error').textContent = 'Error de conexión. Usa el código maestro.';
    }
});

// ================= RESTO DE FUNCIONES (PRODUCTOS, BANNERS, ETC) =================

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
    if (res.ok) {
        error.textContent = '¡Marca agregada!';
        await poblarSelectMarcas();
        document.getElementById('formulario-marca').reset();
        setTimeout(() => { error.textContent = ''; }, 1200);
    }
};

document.getElementById('seccion-form').onsubmit = async function(e) {
    e.preventDefault();
    const nombre = document.getElementById('seccion-nombre').value.trim();
    const error = document.getElementById('seccion-error');
    if (!nombre) return;

    const res = await fetch('/secciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre })
    });

    if (res.ok) {
        error.textContent = '¡Sección agregada!';
        await poblarSelectSecciones();
        document.getElementById('seccion-nombre').value = '';
        setTimeout(() => { error.textContent = ''; }, 1200);
    }
};

document.getElementById('formulario-banner').onsubmit = async function(e) {
    e.preventDefault();
    const titulo = document.getElementById('banner-titulo').value.trim();
    const imagenInput = document.getElementById('banner-imagen');
    const error = document.getElementById('banner-error');

    if (!titulo || !imagenInput.files[0]) return error.textContent = 'Título e imagen requeridos';

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('imagen', imagenInput.files[0]);
    // ... agregar resto de campos si existen ...

    const res = await fetch('/slides', { method: 'POST', body: formData });
    if (res.ok) {
        error.textContent = '¡Banner agregado!';
        document.getElementById('formulario-banner').reset();
        setTimeout(() => { error.textContent = ''; }, 1200);
    }
};

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
        fetchAndRenderProducts();
    } else {
        document.getElementById('product-error').textContent = 'Error al guardar. ¿El servidor está activo?';
    }
});

async function fetchAndRenderProducts() {
    try {
        const res = await fetch('/products');
        if (!res.ok) throw new Error();
        const products = await res.json();
        const list = document.getElementById('products-list');
        if (!products.length) {
            list.innerHTML = '<p class="no-products">No hay productos en el servidor.</p>';
            return;
        }
        list.innerHTML = products.map(p => `
            <div class="producto-item">
                <img src="${p.imagen}" class="producto-imagen">
                <div class="producto-info">
                    <div class="producto-titulo">${p.titulo}</div>
                    <div class="producto-precio">$${p.precio}</div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        document.getElementById('products-list').innerHTML = '<p>Conectando con el servidor de productos...</p>';
    }
}

async function fetchAndRenderBanners() {
    try {
        const res = await fetch('/slides');
        if (!res.ok) return;
        const slides = await res.json();
        const container = document.getElementById('banners-list');
        container.innerHTML = slides.map(s => `<div class="banner-item"><img src="${s.imagen}" class="banner-imagen"></div>`).join('');
    } catch (err) { /* ignorar */ }
}

async function cargarMensajeActivo() {
    try {
        const res = await fetch('/mensaje/ultimo');
        const data = await res.json();
        if (data.mensaje) {
            const msgDiv = document.getElementById('mensaje-global');
            if(msgDiv) {
                msgDiv.textContent = data.mensaje;
                msgDiv.style.display = "block";
            }
        }
    } catch (err) { }
}
