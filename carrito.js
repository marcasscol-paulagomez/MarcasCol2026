// === Funciones de Datos ===
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

// === Agrupar productos iguales ===
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

// === Lógica del Carrito ===
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

    // Preparamos los datos para el checkout
    prepararPagoEpayco(total);
}

// === Integración ePayco ===

function prepararPagoEpayco(total) {
    const carrito = getCarrito();
    // Creamos la descripción comercial
    const descripcion = carrito.length > 0 
        ? carrito.map(p => `${p.titulo} (x${p.cantidad})`).join(', ') 
        : "Compra Marcas.col";

    // Guardamos en una variable global para el handler
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

    // Configuración del handler de ePayco
    // IMPORTANTE: Reemplaza 'TU_PUBLIC_KEY' con la que encuentras en tu panel de ePayco
    const handler = ePayco.checkout.configure({
        key: 'TU_PUBLIC_KEY_AQUÍ', 
        test: true // Cambiar a false cuando vayas a vender real
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

        // Configuración de redirección
        external: "false", 
        confirmation: "https://marcasscol-paulagomez.github.io/MarcasCol2026/confirmacion", // Tu URL de Webhook
        response: "https://marcasscol-paulagomez.github.io/MarcasCol2026/index.html",    // Donde vuelve el cliente

        // Atributos opcionales
        extra1: "Pedido Directo Web",
        type_doc_billing: "cc"
    };

    handler.open(data);
}

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
        // Agregamos el botón de pago dinámicamente si no existe
        totalEl.innerHTML += `
            <button onclick="abrirCheckoutEpayco()" style="background-color: #000; color: #fff; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; width: 100%; margin-top: 20px;">
                PAGAR CON EPAYCO
            </button>
        `;
    }

    guardarCarrito(carrito);
    prepararPagoEpayco(total);

    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("change", actualizarTotales);
        input.addEventListener("keyup", actualizarTotales);
    });
}

document.addEventListener('DOMContentLoaded', renderCarrito);
