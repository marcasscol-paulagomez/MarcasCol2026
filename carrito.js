// === Funciones de Datos ===
function getCarrito() {
    try {
        let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        return agruparDuplicados(carrito); // Agrupamos antes de devolver
    } catch (e) {
        return [];
    }
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

// === FUNCIÓN CLAVE: Agrupar productos iguales ===
function agruparDuplicados(carrito) {
    const carritoAgrupado = [];

    carrito.forEach(producto => {
        // Buscamos si el producto ya existe en nuestro nuevo arreglo (por título)
        const existe = carritoAgrupado.find(p => p.titulo === producto.titulo);

        if (existe) {
            // Si ya existe, sumamos las cantidades
            // Usamos || 1 por si el producto no tiene la propiedad definida
            existe.cantidad = (existe.cantidad || 1) + (producto.cantidad || 1);
        } else {
            // Si no existe, lo añadimos asegurando que tenga cantidad 1 al menos
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
    prepararPagoWompi(total);
}

function prepararPagoWompi(total) {
    const wompiAmountInput = document.getElementById('wompi-amount');
    const wompiReferenceInput = document.getElementById('wompi-reference');
    if (wompiAmountInput) wompiAmountInput.value = Math.round(total * 100);
    if (wompiReferenceInput && !wompiReferenceInput.value) {
        wompiReferenceInput.value = "MARCAS-" + Date.now();
    }
}

function renderCarrito() {
    const carrito = getCarrito(); // Aquí ya viene agrupado por la función agruparDuplicados
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
    
    // Guardamos el carrito limpio (ya agrupado) de vuelta en el localStorage
    guardarCarrito(carrito);
    prepararPagoWompi(total);

    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("change", actualizarTotales);
        input.addEventListener("keyup", actualizarTotales);
    });
}

document.addEventListener('DOMContentLoaded', renderCarrito);
