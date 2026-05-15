// === CONFIGURACIÓN GLOBAL ===
const EPAYCO_PUBLIC_KEY = '19079fa45709b5940ef2b4d0f1cb40b7892cdced'; 
const ENTORNO_PRUEBAS = true; // Cambiar a false para ventas reales

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

// === LÓGICA DEL CARRITO ===
function eliminarDelCarrito(index) {
    let carrito = getCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
    renderCarrito();
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

// === INTEGRACIÓN EPAYCO ===
function prepararPagoEpayco(total) {
    const carrito = getCarrito();
    const descripcion = carrito.length > 0 
        ? carrito.map(p => `${p.titulo} (x${p.cantidad})`).join(', ') 
        : "Compra Marcas.col";

    window.datosCompra = {
        valor: Math.round(total),
        descripcion: descripcion,
        referencia: "MARCAS-" + Date.now()
    };
}

function abrirCheckoutEpayco() {
    if (!window.datosCompra || window.datosCompra.valor <= 0) {
        alert("Tu carrito está vacío o el total no es válido.");
        return;
    }

    // Captura de datos del formulario extendido
    const nombre = document.getElementById('nombre').value;
    const documento = document.getElementById('documento').value;
    const direccion = document.getElementById('direccion').value;
    const ciudad = document.getElementById('municipio').value;
    const depto = document.getElementById('departamento').value;
    const adicionales = document.getElementById('adicional').value;
    const telefono = document.getElementById('telefono').value;

    const handler = ePayco.checkout.configure({
        key: EPAYCO_PUBLIC_KEY,
        test: ENTORNO_PRUEBAS
    });

    const data = {
        name: "Marcas.col",
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
        response: "https://marcasscol-paulagomez.github.io/MarcasCol2026/index.html", 

        // Datos del cliente
        name_billing: nombre,
        address_billing: `${direccion} (${adicionales})`,
        city_billing: ciudad,
        mobilephone_billing: telefono,
        type_doc_billing: "cc",
        number_doc_billing: documento,
        extra1: depto 
    };

    handler.open(data);
}

// === RENDERIZADO ===
function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px;'>Tu carrito está vacío.</p>";
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
            <div class="carrito-item" style="display: flex; align-items: center; border-bottom: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
                <img src="${p.imagen}" alt="${p.titulo}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; margin-right: 15px;">
                <div class="carrito-info" style="flex: 1;">
                    <h3 style="margin: 0; font-size: 1.1rem;">${p.titulo}</h3>
                    <p style="margin: 5px 0;"><strong>Precio:</strong> $${precio.toLocaleString('es-CO')}</p>
                    <label>Cantidad: </label>
                    <input type="number" class="cantidad" value="${cantidad}" min="1" data-index="${i}" style="width: 50px; padding: 5px;">
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})" style="background: none; border: none; color: red; cursor: pointer; font-size: 1.2rem;">❌</button>
            </div>
        `;
    });

    list.innerHTML = html;
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(total).toLocaleString('es-CO')}</h2>`;
    }

    guardarCarrito(carrito);
    prepararPagoEpayco(total);

    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("change", actualizarTotales);
        input.addEventListener("keyup", actualizarTotales);
    });
}

document.addEventListener('DOMContentLoaded', renderCarrito);
