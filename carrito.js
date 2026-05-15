// === CONFIGURACIÓN GLOBAL ===
const EPAYCO_PUBLIC_KEY = '19079fa45709b5940ef2b4d0f1cb40b7892cdced'; 
const ENTORNO_PRUEBAS = true; // Cambiar a false para ventas reales en el panel de ePayco

// === FUNCIONES DE DATOS ===
function getCarrito() {
    try {
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        return agruparDuplicados(carrito);
    } catch (e) {
        console.error("Error al obtener carrito:", e);
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

function agruparDuplicados(carrito) {
    const carritoAgrupado = [];
    carrito.forEach(producto => {
        const existe = carritoAgrupado.find(p => p.titulo === producto.titulo);
        if (existe) {
            existe.cantidad = (existe.cantidad || 1) + (producto.cantidad || 1);
        } else {
            if (!producto.cantidad) producto.cantidad = 1;
            carritoAgrupado.push(producto);
        }
    });
    return carritoAgrupado;
}

// === LÓGICA DEL CARRITO ===
function eliminarDelCarrito(index) {
    let carrito = getCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
    renderCarrito();
    actualizarIconoCarrito();
}

function actualizarTotales() {
    const carrito = getCarrito();
    let total = 0;
    const items = document.querySelectorAll(".cantidad");

    items.forEach((input) => {
        const index = input.getAttribute("data-index");
        const cantidad = parseInt(input.value) || 1;
        if (carrito[index]) {
            carrito[index].cantidad = cantidad;
            total += parseFloat(carrito[index].precio) * cantidad;
        }
    });

    guardarCarrito(carrito);
    
    const totalEl = document.getElementById("carrito-total");
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(total).toLocaleString('es-CO')}</h2>`;
    }

    prepararPagoEpayco(total);
}

function actualizarIconoCarrito() {
    const carrito = getCarrito();
    const cartCount = document.getElementById("cart-count");
    if (cartCount) {
        cartCount.textContent = `(${carrito.length})`;
    }
}

// === INTEGRACIÓN EPAYCO ===

function prepararPagoEpayco(total) {
    const carrito = getCarrito();
    const descripcion = carrito.length > 0 
        ? carrito.map(p => `${p.titulo} (x${p.cantidad})`).join(', ') 
        : "Compra Marcas Col";

    window.datosCompra = {
        valor: Math.round(total),
        descripcion: descripcion.substring(0, 250), // Límite de caracteres de ePayco
        referencia: "MARCAS-" + Date.now()
    };
}

function abrirCheckoutEpayco() {
    // 1. Validar si hay productos
    if (!window.datosCompra || window.datosCompra.valor <= 0) {
        alert("Tu carrito está vacío o el total no es válido.");
        return;
    }

    // 2. Captura y validación de datos del formulario
    const nombre = document.getElementById('nombre').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const ciudad = document.getElementById('municipio').value.trim();
    const depto = document.getElementById('departamento').value.trim();
    const adicionales = document.getElementById('adicional').value.trim();
    const telefono = document.getElementById('telefono').value.trim();

    if (!nombre || !documento || !direccion || !ciudad || !depto || !telefono) {
        alert("Por favor, completa todos los campos obligatorios del formulario de envío.");
        return;
    }

    // 3. Configuración del Handler
    const handler = ePayco.checkout.configure({
        key: EPAYCO_PUBLIC_KEY,
        test: ENTORNO_PRUEBAS
    });

    // 4. Parámetros de la transacción
    const data = {
        name: "Marcas Col",
        description: window.datosCompra.descripcion,
        invoice: window.datosCompra.referencia,
        currency: "cop",
        amount: window.datosCompra.valor.toString(),
        tax_base: "0",
        tax: "0",
        country: "co",
        lang: "es",
        external: "false", 
        confirmation: "https://marcasscol-paulagomez.github.io/MarcasCol2026/confirmacion",
        response: "https://www.marcascol-bypaulagomez.com/index.html", 

        // Datos del cliente automáticos para ahorrarle trabajo al usuario
        name_billing: nombre,
        address_billing: `${direccion} ${adicionales}`,
        city_billing: ciudad,
        mobilephone_billing: telefono,
        type_doc_billing: "cc",
        number_doc_billing: documento,
        extra1: depto 
    };

    console.log("Iniciando pasarela ePayco...");
    handler.open(data);
}

// === RENDERIZADO ===
function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <p style="font-size:1.2rem; color:#666;">Tu carrito está vacío.</p>
                <a href="index.html" class="btn-secundario" style="display:inline-block; margin-top:20px; text-decoration:none; padding:10px 20px; background:#eee; color:#333; border-radius:5px;">Volver a la tienda</a>
            </div>`;
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

    let total = 0;
    let html = "";

    carrito.forEach((p, i) => {
        const cantidad = p.cantidad || 1;
        const precio = parseFloat(p.precio) || 0;
        total += precio * cantidad;

        html += `
            <div class="carrito-item" style="display: flex; align-items: center; border-bottom: 1px solid #ddd; padding: 15px 0;">
                <img src="${p.imagen}" alt="${p.titulo}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
                <div class="carrito-info" style="flex: 1;">
                    <h3 style="margin: 0; font-size: 1.1rem; color: #333;">${p.titulo}</h3>
                    <p style="margin: 5px 0; color: #ff5000; font-weight: bold;">$${precio.toLocaleString('es-CO')}</p>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label style="font-size: 0.9rem; color: #666;">Cantidad:</label>
                        <input type="number" class="cantidad" value="${cantidad}" min="1" data-index="${i}" 
                               style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; text-align: center;">
                    </div>
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})" 
                        style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.4rem; padding: 10px;" title="Eliminar">
                    <i class="fa-solid fa-trash-can"></i> ❌
                </button>
            </div>
        `;
    });

    list.innerHTML = html;
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(total).toLocaleString('es-CO')}</h2>`;
    }

    prepararPagoEpayco(total);

    // Escuchar cambios en las cantidades
    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("change", actualizarTotales);
        input.addEventListener("keyup", actualizarTotales);
    });
}

// === CARGA INICIAL ===
document.addEventListener('DOMContentLoaded', () => {
    renderCarrito();
    actualizarIconoCarrito();
});
