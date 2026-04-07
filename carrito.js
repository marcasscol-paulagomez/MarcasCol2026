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
            // Actualizamos el objeto en el array
            carrito[i].cantidad = cantidad;
            total += parseFloat(carrito[i].precio) * cantidad;
        }
    });

    guardarCarrito(carrito);

    const totalEl = document.getElementById("carrito-total");
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(total).toLocaleString('es-CO')}</h2>`;
    }
    
    // Actualizamos Wompi cada vez que cambie una cantidad
    prepararPagoWompi(total);
}

// Función para actualizar los campos ocultos de Wompi
function prepararPagoWompi(total) {
    const wompiAmountInput = document.getElementById('wompi-amount');
    const wompiReferenceInput = document.getElementById('wompi-reference');

    if (wompiAmountInput && wompiReferenceInput) {
        // Wompi pide el monto en centavos
        const totalCentavos = Math.round(total * 100);
        wompiAmountInput.value = totalCentavos;

        // Generar referencia única si está vacía
        if (!wompiReferenceInput.value) {
            wompiReferenceInput.value = "MARCAS-" + Date.now();
        }
    }
}

function renderCarrito() {
    let carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    const cartSection = document.getElementById("cart");
    const checkoutSection = document.getElementById("checkout");

    if (carrito.length === 0) {
        list.innerHTML = "<p>El carrito está vacío.</p>";
        totalEl.innerHTML = "";
        if(checkoutSection) checkoutSection.classList.add("hidden");
        // Ocultar botón de finalizar si no hay nada
        const btnFin = document.getElementById("btn-continuar-checkout");
        if(btnFin) btnFin.style.display = "none";
        return;
    }

    let total = 0;

    list.innerHTML = carrito.map((p, i) => {
        const cantidad = p.cantidad || 1;
        const subtotal = parseFloat(p.precio) * cantidad;
        total += subtotal;

        return `
            <div class="carrito-item">
                <img src="${p.imagen}" alt="${p.titulo}">
                <div class="carrito-info">
                    <h3>${p.titulo}</h3>
                    <p><strong>Precio:</strong> $${parseFloat(p.precio).toLocaleString('es-CO')}</p>
                    <p><strong>Marca:</strong> ${p.marca}</p>
                    <p><strong>Sección:</strong> ${p.seccion}</p>
                    <label>Cantidad:</label>
                    <input type="number" class="cantidad" 
                           value="${cantidad}" min="1" data-index="${i}">
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})">❌ Eliminar</button>
            </div>
        `;
    }).join("");

    totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(total).toLocaleString('es-CO')}</h2>`;
    
    prepararPagoWompi(total);

    // Eventos para detectar cambios de cantidad inmediatamente
    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("input", actualizarTotales);
    });
}

// === Eventos de Navegación ===
document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const
