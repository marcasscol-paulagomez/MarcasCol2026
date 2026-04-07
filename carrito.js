// === Funciones de Datos (LocalStorage) ===
function getCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

// === Lógica del Carrito (Momento 1) ===
function eliminarDelCarrito(index) {
    let carrito = getCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
    renderCarrito(); // Redibuja todo el carrito
}

function actualizarTotales() {
    const carrito = getCarrito();
    let totalGeneral = 0;

    // Recorremos todos los inputs de cantidad actuales en el DOM
    const inputs = document.querySelectorAll(".cantidad");
    
    inputs.forEach((input) => {
        const index = input.getAttribute("data-index");
        const nuevaCantidad = parseInt(input.value) || 1;

        if (carrito[index]) {
            carrito[index].cantidad = nuevaCantidad;
            totalGeneral += parseFloat(carrito[index].precio) * nuevaCantidad;
        }
    });

    // Guardamos los cambios de cantidades en el almacenamiento local
    guardarCarrito(carrito);

    // Actualizamos el total visible en el HTML
    const totalEl = document.getElementById("carrito-total");
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(totalGeneral).toLocaleString('es-CO')}</h2>`;
    }
    
    // Sincronizamos los datos con los campos ocultos de Wompi
    prepararPagoWompi(totalGeneral);
}

function prepararPagoWompi(total) {
    const wompiAmountInput = document.getElementById('wompi-amount');
    const wompiReferenceInput = document.getElementById('wompi-reference');

    if (wompiAmountInput) {
        // Wompi requiere el monto en centavos (ej: 50000 pesos -> 5000000 centavos)
        wompiAmountInput.value = Math.round(total * 100);
    }
    
    // Generamos la referencia única solo si no existe una ya asignada
    if (wompiReferenceInput && !wompiReferenceInput.value) {
        wompiReferenceInput.value = "MARCAS-" + Date.now();
    }
}

function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    const cartSection = document.getElementById("cart");
    const checkoutSection = document.getElementById("checkout");

    // Caso: Carrito vacío
    if (carrito.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:50px;">
                <p>Tu carrito está actualmente vacío.</p>
                <button onclick="window.location.href='index.html'" class="btn-secundario">Ir a la tienda</button>
            </div>`;
        if (totalEl) totalEl.innerHTML = "";
        // Ocultamos el botón de finalizar pedido si no hay productos
        const btnFinalizar = document.getElementById("btn-continuar-checkout");
        if (btnFinalizar) btnFinalizar.style.display = "none";
        return;
    }

    let totalAcumulado = 0;
    
    // Generamos el HTML dinámico de cada producto
    list.innerHTML = carrito.map((p, i) => {
        const cantidad = p.cantidad || 1;
        const precioNum = parseFloat(p.precio) || 0;
        const subtotal = precioNum * cantidad;
        totalAcumulado += subtotal;

        return `
            <div class="carrito-item">
                <img src="${p.imagen}" alt="${p.titulo}">
                <div class="carrito-info">
                    <h3>${p.titulo}</h3>
                    <p><strong>Precio:</strong> $${precioNum.toLocaleString('es-CO')}</p>
                    <div class="cantidad-control">
                        <label for="cantidad-${i}">Cantidad:</label>
                        <input type="number" id="cantidad-${i}" class="cantidad" 
                               value="${cantidad}" min="1" data-index="${i}">
                    </div>
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})">❌</button>
            </div>
        `;
    }).join("");

    // Actualizamos el total inicial
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(totalAcumulado).toLocaleString('es-CO')}</h2>`;
    }

    prepararPagoWompi(totalAcumulado);

    // Re-asign
