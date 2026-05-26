// === CONFIGURACIÓN GLOBAL ===
const EPAYCO_PUBLIC_KEY = 'c5fd780339f9e58bac3e6571c71d53d6'; 
const ENTORNO_PRUEBAS = true; // Cambiar a false cuando pases a producción definitiva

// === FUNCIONES DE DATOS ===
function getCarrito() {
    try {
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        return agruparDuplicados(carrito);
    } catch (e) {
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

function eliminarDelCarrito(index) {
    let carrito = getCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
    renderCarrito();
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
    const subtotalEl = document.getElementById("subtotal-val");
    if (totalEl) totalEl.innerText = `$${Math.round(total).toLocaleString('es-CO')}`;
    if (subtotalEl) subtotalEl.innerText = `$${Math.round(total).toLocaleString('es-CO')}`;

    prepararPagoEpayco(total);
}

// === INTEGRACIÓN EPAYCO ===
function prepararPagoEpayco(total) {
    const carrito = getCarrito();
    const descripcion = carrito.length > 0 
        ? carrito.map(p => `${p.titulo} (x${p.cantidad})`).join(', ') 
        : "Compra Marcas Col";

    window.datosCompra = {
        valor: Math.round(total),
        descripcion: descripcion.substring(0, 240), 
        referencia: "MARCAS-" + Date.now()
    };
}

function abrirCheckoutEpayco() {
    if (!window.datosCompra || window.datosCompra.valor <= 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    // Captura campos del formulario unificado
    const nombre = document.getElementById('nombre').value.trim();
    const documento = document.getElementById('documento').value.trim().replace(/[^0-9]/g, "");
    const direccion = document.getElementById('direccion').value.trim().replace(/[^a-zA-Z0-9 ]/g, "");
    const ciudad = document.getElementById('municipio').value.trim();
    const depto = document.getElementById('departamento').value.trim();
    const adicionales = document.getElementById('adicional').value.trim();
    const telefono = document.getElementById('telefono').value.trim().replace(/[^0-9]/g, "");

    if (!nombre || !documento || !direccion || !ciudad || !depto || !telefono) {
        alert("Por favor, completa todos los campos obligatorios del despacho antes de pagar.");
        return;
    }

    const handler = ePayco.checkout.configure({
        key: EPAYCO_PUBLIC_KEY,
        test: ENTORNO_PRUEBAS
    });

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
        confirmation: "https://www.marcascol-bypaulagomez.com/confirmacion", 
        response: "https://www.marcascol-bypaulagomez.com/index.html", 

        name_billing: nombre,
        address_billing: `${direccion} ${adicionales}`,
        city_billing: ciudad,
        mobilephone_billing: telefono,
        type_doc_billing: "cc",
        number_doc_billing: documento,
        extra1: depto 
    };

    console.log("Desplegando pasarela unificada ePayco...");
    handler.open(data);
}

// === RENDERIZADO ===
function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("total-val");
    const subtotalEl = document.getElementById("subtotal-val");
    const resCant = document.getElementById("resumen-cantidad");

    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <p style="font-size:1.1rem; color:#888;">No tienes productos seleccionados.</p>
                <a href="index.html" style="display:inline-block; margin-top:15px; text-decoration:none; padding:10px 20px; background:#000; color:#fff; border-radius:6px; font-weight:bold;">Ir al catálogo</a>
            </div>`;
        if (totalEl) totalEl.innerText = "$0";
        if (subtotalEl) subtotalEl.innerText = "$0";
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
            <div class="carrito-item">
                <img src="${p.imagen}" alt="${p.titulo}" class="item-img">
                <div class="item-info">
                    <h3>${p.titulo}</h3>
                    <p>$${precio.toLocaleString('es-CO')}</p>
                    <div class="qty-wrapper">
                        <label style="font-size: 0.85rem; color: #777;">Cant:</label>
                        <input type="number" class="cantidad-input" value="${cantidad}" min="1" data-index="${i}">
                    </div>
                </div>
                <button class="btn-remove" onclick="eliminarDelCarrito(${i})">
                    ❌
                </button>
            </div>
        `;
    });

    list.innerHTML = html;
    if (totalEl) totalEl.innerText = `$${Math.round(total).toLocaleString('es-CO')}`;
    if (subtotalEl) subtotalEl.innerText = `$${Math.round(total).toLocaleString('es-CO')}`;
    if (resCant) resCant.innerText = `${carrito.length} ${carrito.length === 1 ? 'producto' : 'productos'}`;

    prepararPagoEpayco(total);

    document.querySelectorAll(".cantidad-input").forEach(input => {
        input.addEventListener("change", actualizarTotales);
    });
}

document.addEventListener('DOMContentLoaded', renderCarrito);
