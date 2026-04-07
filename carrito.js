// === Funciones del carrito ===
function getCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
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

    const items = document.querySelectorAll(".carrito-item");
    items.forEach((item, i) => {
        const cantidadInput = item.querySelector(".cantidad");
        if (cantidadInput && carrito[i]) {
            const cantidad = parseInt(cantidadInput.value) || 1;
            total += parseFloat(carrito[i].precio) * cantidad;
            carrito[i].cantidad = cantidad;
        }
    });

    guardarCarrito(carrito);

    const totalEl = document.getElementById("carrito-total");
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${total.toLocaleString('es-CO')}</h2>`;
    }
    
    // IMPORTANTE: Preparamos los datos para Wompi
    prepararPagoWompi(total);
}

// Función específica para actualizar los campos ocultos de Wompi
function prepararPagoWompi(total) {
    const wompiAmountInput = document.getElementById('wompi-amount');
    const wompiReferenceInput = document.getElementById('wompi-reference');

    if (wompiAmountInput && wompiReferenceInput) {
        // Wompi pide el monto en centavos (ej: 50.000 COP -> 5000000)
        const totalCentavos = Math.round(total * 100);
        wompiAmountInput.value = totalCentavos;

        // Generar referencia única (ej: MARCAS-1712500000)
        if (!wompiReferenceInput.value || wompiReferenceInput.value === "") {
            wompiReferenceInput.value = "MARCAS-" + Date.now();
        }
    }
}

function renderCarrito() {
    let carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    const checkoutSection = document.getElementById("checkout");

    if (carrito.length === 0) {
        list.innerHTML = "<p>El carrito está vacío.</p>";
        totalEl.textContent = "";
        if(checkoutSection) checkoutSection.classList.add("hidden");
        return;
    }

    let total = 0;

    list.innerHTML = carrito.map((p, i) => {
        if (!p.cantidad) p.cantidad = 1;
        const subtotal = parseFloat(p.precio) * p.cantidad;
        total += subtotal;

        return `
            <div class="carrito-item">
                <img src="${p.imagen}" alt="${p.titulo}">
                <div class="carrito-info">
                    <h3>${p.titulo}</h3>
                    <p><strong>Precio:</strong> $${parseFloat(p.precio).toLocaleString('es-CO')}</p>
                    <p><strong>Marca:</strong> ${p.marca}</p>
                    <p><strong>Sección:</strong> ${p.seccion}</p>
                    <label for="cantidad-${i}">Cantidad:</label>
                    <input type="number" id="cantidad-${i}" class="cantidad" 
                           value="${p.cantidad}" min="1" data-index="${i}">
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})">❌ Eliminar</button>
            </div>
        `;
    }).join("");

    totalEl.innerHTML = `<h2>Total a pagar: $${total.toLocaleString('es-CO')}</h2>`;
    
    // Inicializar datos de Wompi
    prepararPagoWompi(total);

    // Eventos para inputs de cantidad
    document.querySelectorAll(".cantidad").forEach(input => {
