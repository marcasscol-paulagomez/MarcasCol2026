// ================= Poblar selects dinámicos =================

// Poblar select de marcas
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

// Poblar select de secciones
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

// Al cargar DOM, poblar selects y mensaje activo
window.addEventListener('DOMContentLoaded', () => {
    poblarSelectMarcas();
    poblarSelectSecciones();
    cargarMensajeActivo();
});

// Agregar listeners para botones admin después de login
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
    // logout
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
        btnLogout.addEventListener('click', async () => {
            try {
                await fetch('/owner-logout', { method: 'POST', credentials: 'include' });
            } catch (err) {
                console.warn('Error during logout', err);
            }
            // reload page to show login form again
            window.location.reload();
        });
    }
}

// ================= Marca dinámica =================
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
        const select = document.getElementById('product-marca');
        if (select) select.value = nombre;
        document.getElementById('formulario-marca').reset();
        setTimeout(() => { error.textContent = ''; }, 1200);
    }
};

// ================= Sección dinámica =================
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
    if (!res.ok) {
        error.textContent = data.error || 'Error';
    } else {
        error.textContent = '¡Sección agregada!';
        await poblarSelectSecciones();
        const select = document.getElementById('product-seccion');
        if (select) select.value = nombre;
        document.getElementById('seccion-nombre').value = '';
        setTimeout(() => { error.textContent = ''; }, 1200);
    }
};

// ================= Banner dinámico =================
document.getElementById('formulario-banner').onsubmit = async function(e) {
    e.preventDefault();
    const titulo = document.getElementById('banner-titulo').value.trim();
    const descripcion = document.getElementById('banner-descripcion').value.trim();
    const marca = document.getElementById('banner-marca').value.trim();
    const imagenInput = document.getElementById('banner-imagen');
    const boton_texto = document.getElementById('banner-boton-texto').value.trim();
    const boton_url = document.getElementById('banner-boton-url').value.trim();
    const error = document.getElementById('banner-error');

    error.textContent = '';
    if (!titulo || !imagenInput.files[0]) return error.textContent = 'Título e imagen requeridos';

    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    formData.append('marca', marca);
    formData.append('imagen', imagenInput.files[0]);
    formData.append('boton_texto', boton_texto);
    formData.append('boton_url', boton_url);

    const res = await fetch('/slides', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) error.textContent = data.error || 'Error';
    else {
        error.textContent = '¡Banner agregado!';
        document.getElementById('formulario-banner').reset();
        setTimeout(() => { error.textContent = ''; }, 1200);
    }
};

// Alternar login/registro eliminado (no se usan usuarios)

// ================= Mostrar/Ocultar contraseña =================
function togglePassword(inputId, el) {
    const input = document.getElementById(inputId);
    if (input.type === "password") {
        input.type = "text";
        el.classList.remove("fa-eye");
        el.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        el.classList.remove("fa-eye-slash");
        el.classList.add("fa-eye");
    }
}

// Registro eliminado: la funcionalidad de usuarios ya no existe

// ================= Login =================
// Owner login: enviar el código configurado en Koyeb (CODIGO_REGISTRO)
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
        // mostrar area admin y controles
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
    const data = await res.json();
    if (res.ok) {
        document.getElementById('product-error').textContent = '';
        alert('Producto guardado exitosamente');
        document.getElementById('product-form').reset();
        await fetchAndRenderProducts();
    } else {
        document.getElementById('product-error').textContent = data.error || 'Error al guardar producto';
    }
});

// ================= Listar productos =================
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
            <img src="${p.imagen}" alt="${p.titulo || p.title}" class="producto-imagen">
            <div class="producto-info">
                <div class="producto-titulo">${p.titulo || p.title} <span class="product-section">(${p.seccion || p.section})</span></div>
                <div class="producto-descripcion">${p.descripcion || p.description}</div>
                <div class="producto-precio">$${p.precio || p.price}</div>
            </div>
            <button class="btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar</button>
        </div>
    `).join('');
}

// ================= Listar banners (slides) =================
async function fetchAndRenderBanners() {
    const res = await fetch('/slides', { credentials: 'include' });
    if (!res.ok) return;
    const slides = await res.json();
    const container = document.getElementById('banners-list');

    if (!slides.length) {
        container.innerHTML = '<p class="no-products">No hay banners publicados.</p>';
        return;
    }

    container.innerHTML = slides.map(s => `
        <div class="banner-item">
            <img src="${s.imagen || ''}" alt="${s.titulo || ''}" class="banner-imagen">
            <div class="banner-info">
                <div class="banner-titulo">${s.titulo || ''}</div>
                <div class="banner-desc">${s.descripcion || ''}</div>
                <div class="banner-marca">${s.marca || ''}</div>
            </div>
            <button class="btn-eliminar" onclick="eliminarBanner(${s.id})">Eliminar</button>
        </div>
    `).join('');
}

// ================= Eliminar banner =================
async function eliminarBanner(id) {
    if (!confirm("¿Seguro que deseas eliminar este banner?")) return;
    try {
        const res = await fetch(`/slides/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
            alert("Banner eliminado correctamente");
            await fetchAndRenderBanners();
        } else {
            alert(data.error || "Error al eliminar banner");
        }
    } catch (err) {
        alert("Error de conexión con el servidor");
    }
}

// ================= Eliminar producto =================
async function eliminarProducto(id) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
        const res = await fetch(`/product/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        const data = await res.json();
        if (res.ok) {
            alert("Producto eliminado correctamente");
            await fetchAndRenderProducts();
        } else {
            alert(data.error || "Error al eliminar producto");
        }
    } catch (err) {
        alert("Error de conexión con el servidor");
    }
}

// ================= Mensaje dinámico =================
document.getElementById('mensaje-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const texto = document.getElementById('mensaje-texto').value.trim();
    const errorBox = document.getElementById('mensaje-error');

    if (!texto) {
        errorBox.textContent = "El mensaje no puede estar vacío";
        return;
    }

    try {
        const res = await fetch('/mensajes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ texto })
        });

        // Intentar parsear JSON sólo si el servidor lo envía
        let data = {};
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            try { data = await res.json(); } catch (parseErr) { console.warn('No JSON en respuesta:', parseErr); }
        }

        if (res.ok) {
            // Mostrar mensaje principal y mostrar confirmación en el formulario
            const globalMsg = document.getElementById('mensaje-global');
            if (globalMsg) {
                globalMsg.style.display = "block";
                globalMsg.textContent = texto;
            }
            // mostrar mensaje de éxito junto al formulario
            const successBox = document.getElementById('mensaje-success');
            if (successBox) {
                successBox.textContent = 'Mensaje guardado correctamente';
                successBox.style.display = 'block';
            }
            // limpiar error y form
            errorBox.textContent = "";
            document.getElementById('mensaje-form').reset();

            // ocultar success después de 3 segundos
            setTimeout(() => {
                if (successBox) successBox.style.display = 'none';
            }, 3000);
        } else {
            // ocultar success si había alguno
            const successBox = document.getElementById('mensaje-success');
            if (successBox) successBox.style.display = 'none';
            // Si el servidor devolvió JSON con 'error', mostrarlo, si no mostrar genérico
            errorBox.textContent = (data && data.error) ? data.error : "Error al guardar mensaje";
        }
    } catch (err) {
        console.error('Error enviando mensaje:', err);
        const successBox = document.getElementById('mensaje-success');
        if (successBox) successBox.style.display = 'none';
        errorBox.textContent = "Error de conexión con el servidor: " + (err.message || err);
    }
});

// ================= Mostrar mensaje activo al cargar =================
async function cargarMensajeActivo() {
    try {
        const res = await fetch('/mensaje/ultimo');
        const data = await res.json();
        if (data.mensaje) {
            const msgDiv = document.getElementById('mensaje-global');
            msgDiv.textContent = data.mensaje;
            msgDiv.style.display = "block";
        }
    } catch (err) {
        console.error("No se pudo cargar el mensaje:", err);
    }
}
