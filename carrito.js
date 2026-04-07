// === Funciones de Datos ===
function getCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
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

    // Capturamos las cantidades actuales de los inputs
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

    if (wompiAmountInput) {
        wompiAmountInput.value = Math.round(total * 100); // Centavos
    }
    if (wompiReferenceInput && !wompiReferenceInput.value) {
        wompiReferenceInput.value = "MARCAS-" + Date.now();
    }
}

function renderCarrito() {
    let carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    const cartSection = document.getElementById("cart");
    const checkoutSection = document.getElementById("checkout");

    if (carrito.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px;'>El carrito está vacío.</p>";
        if(totalEl) totalEl.innerHTML = "";
        if(checkoutSection) checkoutSection.classList.add("hidden");
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
                    <label>Cantidad:</label>
                    <input type="number" class="cantidad" value="${cantidad}" min="1" data-index="${i}">
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})">❌ Eliminar</button>
            </div>
        `;
    }).join("");

    totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(total).toLocaleString('es-CO')}</h2>`;
    
    prepararPagoWompi(total);

    // Escuchar cambios en las cantidades para actualizar el precio inmediatamente
    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("input", actualizarTotales);
    });
}

// === Navegación y Eventos Globales ===
document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const cartSection = document.getElementById("cart");
    const checkoutSection = document.getElementById("checkout");

    // Ir a Checkout
    const btnContinuar = document.getElementById("btn-continuar-checkout");
    if (btnContinuar) {
        btnContinuar.addEventListener("click", () => {
            cartSection.classList.add("hidden");
            checkoutSection.classList.remove("hidden");
            window.scrollTo(0, 0);
        });
    }

    // Volver al Carrito
    const btnVolver = document.getElementById("btn-volver-carrito");
    if (btnVolver) {
        btnVolver.addEventListener("click", () => {
            checkoutSection.classList.add("hidden");
            cartSection.classList.remove("hidden");
        });
    }
});
