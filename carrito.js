// === CONFIGURACIÓN GLOBAL ===
// Actualizado con tu nueva Public Key del panel de ePayco
const EPAYCO_PUBLIC_KEY = 'c5fd780339f9e58bac3e6571c71d53d6'; 
const ENTORNO_PRUEBAS = true; // Cambiar a false cuando pases a producción (ventas reales)

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
    const items = document.querySelectorAll(".cantidad-input");

    items.forEach((input) => {
        const index = input.getAttribute("data-index");
        const cantidad = parseInt(input.value) || 1;
        if (carrito[index]) {
            carrito[index].cantidad = cantidad;
            total += parseFloat(carrito[index].precio) * cantidad;
        }
    });

    guardarCarrito(carrito);
    
    const totalEl = document.getElementById("total-val");
    if (totalEl) {
        totalEl.innerText = `$${Math.round(total).toLocaleString('es-CO')}`;
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

// === INTEGRACIÓN EPAYCO (Ajustado según documentación oficial) ===

function prepararPagoEpayco(total) {
    const carrito = getCarrito();
    const descripcion = carrito.length > 0 
        ? carrito.map(p => `${p.titulo} (x${p.cantidad})`).join(', ') 
        : "Compra Marcas Col";

    window.datosCompra = {
        valor: Math.round(total),
        // ePayco limita la descripción a 250 caracteres en su pasarela estándar
        descripcion: descripcion.substring(0, 245), 
        referencia: "MARCAS-" + Date.now()
    };
}

function abrirCheckoutEpayco() {
    // 1. Validar si el carrito tiene un precio real
    if (!window.datosCompra || window.datosCompra.valor <= 0) {
        alert("Tu carrito está vacío o el total no es válido.");
        return;
    }

    // 2. Captura y limpieza de datos del formulario (Evita caracteres especiales que rompan ePayco)
    const nombre = document.getElementById('nombre').value.trim();
    const documento = document.getElementById('documento').value.trim().replace(/[^0-9]/g, "");
    const direccion = document.getElementById('direccion').value.trim().replace(/[^a-zA-Z0-9 ]/g, "");
    const ciudad = document.getElementById('municipio').value.trim();
    const depto = document.getElementById('departamento').value.trim();
    const telefono = document.getElementById('telefono').value.trim().replace(/[^0-9]/g, "");

    if (!nombre || !documento || !direccion || !ciudad || !depto || !telefono) {
        alert("Por favor, completa todos los campos obligatorios para procesar el despacho.");
        return;
    }

    // 3. Inicializar el objeto de ePayco con tu llave pública correcta
    const handler = ePayco.checkout.configure({
        key: EPAYCO_PUBLIC_KEY,
        test: ENTORNO_PRUEBAS
    });

    // 4. Mapeo estricto de variables según la documentación técnica de ePayco
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
        external: "false", // "false" abre el modal estético encima de la web sin redirigir de inmediato

        // Rutas de retorno oficiales ajustadas a tu dominio personalizado
        confirmation: "https://www.marcascol-bypaulagomez.com/confirmacion", 
        response: "https://www.marcascol-bypaulagomez.com/index.html", 

        // Atributos de facturación y envío corregidos según estándar ePayco
        name_billing: nombre,
        address_billing: direccion,
        city_billing: ciudad,
        mobilephone_billing: telefono,
        type_doc_billing: "cc",
        number_doc_billing: documento,
        
        // Pasamos el departamento en el campo extra opcional
        extra1: depto 
    };

    console.log("Abriendo pasarela ePayco con llave: ", EPAYCO_PUBLIC_KEY);
    handler.open(data);
}

// === RENDERIZADO DE INTERFAZ ===
function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalVal = document.getElementById("total-val");
    const resCant = document.getElementById("resumen-cantidad");

    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <p style="font-size:1.2rem; color:#666;">Tu carrito está vacío.</p>
                <a href="index.html" style="display:inline-block; margin-top:20px; text-decoration:none; padding:12px 24px; background:#000; color:#fff; border-radius:6px; font-weight:bold;">Volver a la tienda</a>
            </div>`;
        if (totalVal) totalVal.innerText = "$0";
        if (resCant) resCant.innerText = "0 items";
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
                        <input type="number" class="cantidad-input" value="${cantidad}" min="1" data-index="${i}" 
                               style="width: 60px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; text-align: center;">
                    </div>
                </div>
                <button class="btn-remove" onclick="eliminarDelCarrito(${i})" 
                        style="background: none; border: none; color: #e74c3c; cursor: pointer; font-size: 1.2rem; padding: 10px;" title="Eliminar">
                    ❌
                </button>
            </div>
        `;
    });

    list.innerHTML = html;
    if (totalVal) totalVal.innerText = `$${Math.round(total).toLocaleString('es-CO')}`;
    if (resCant) resCant.innerText = `${carrito.length} productos`;

    prepararPagoEpayco(total);

    // Añadir eventos a los inputs de cantidad
    document.querySelectorAll(".cantidad-input").forEach(input => {
        input.addEventListener("change", actualizarTotales);
    });
}

// === EJECUCIÓN INICIAL ===
document.addEventListener('DOMContentLoaded', () => {
    renderCarrito();
    actualizarIconoCarrito();
});
