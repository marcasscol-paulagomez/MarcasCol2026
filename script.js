// Si el frontend y backend están en el mismo servicio de Railway, dejar vacío: ""
// Si están separados, pegar la URL de Railway: "https://tu-app.up.railway.app"
const API_BASE_URL = ""; 

// ================= Poblar selects dinámicos =================

async function poblarSelectMarcas() {
    const select = document.getElementById('product-marca');
    if (!select) return;
    try {
        const res = await fetch(`${API_BASE_URL}/marcas`);
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
        const res = await fetch(`${API_BASE_URL}/secciones`);
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

window.addEventListener('DOMContentLoaded', () => {
    poblarSelectMarcas();
    poblarSelectSecciones();
    cargarMensajeActivo();
});

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
        btnLogout.addEventListener('click', async () => {
            try {
                await fetch(`${API_BASE_URL}/owner-logout`, { method: 'POST', credentials: 'include' });
            } catch (err) {
                console.warn('Error during logout', err);
            }
            window.location.reload();
        });
    }
}

// ================= Login =================
document.getElementById('owner-login-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const code = document.getElementById('owner-code').value;
    const res = await fetch(`${API_BASE_URL}/owner-login`, {
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

    const res = await fetch(`${API_BASE_URL}/product`, { method: 'POST', body: formData, credentials: 'include' });
    if (res.ok) {
        alert('Producto guardado exitosamente');
        document.getElementById('product-form').reset();
        await fetchAndRenderProducts();
    } else {
        const data = await res.json();
        document.getElementById('product-error').textContent = data.error || 'Error al guardar producto';
    }
});

// ================= Listar productos =================
async function fetchAndRenderProducts() {
    const res = await fetch(`${API_BASE_URL}/products`, { credentials: 'include' });
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
            <button class="btn-eliminar" onclick="eliminarProducto(${p.id})">Eliminar</button>
        </div>
    `).join('');
}

// ================= Eliminar producto =================
async function eliminarProducto(id) {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    try {
        const res = await fetch(`${API_BASE_URL}/product/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if (res.ok) {
            alert("Producto eliminado correctamente");
            await fetchAndRenderProducts();
        } else {
            alert("Error al eliminar producto");
        }
    } catch (err) {
        alert("Error de conexión");
    }
}

// ================= Mensaje dinámico =================
async function cargarMensajeActivo() {
    try {
        const res = await fetch(`${API_BASE_URL}/mensaje/ultimo`);
        const data = await res.json();
        if (data.mensaje) {
            const msgDiv = document.getElementById('mensaje-global');
            if (msgDiv) {
                msgDiv.textContent = data.mensaje;
                msgDiv.style.display = "block";
            }
        }
    } catch (err) {
        console.error("No se pudo cargar el mensaje:", err);
    }
}
