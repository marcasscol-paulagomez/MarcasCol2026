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
    const nombre = document.getElementById('seccion-nombre').
