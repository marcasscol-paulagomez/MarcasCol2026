// === 1. Gestión de Datos (LocalStorage) ===
function getCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

// === 2. Funciones de Acción ===
function eliminarDelCarrito(index) {
    let carrito = getCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
    renderCarrito(); // Volver a dibujar
}

function actualizarTotales() {
    const carrito = getCarrito();
    let total = 0;

    // Recorremos los inputs actuales para capturar las cantidades nuevas
    const inputs = document.querySelectorAll(".cantidad");
    inputs.forEach((input) => {
        const index = input.getAttribute("data-index");
        const cantidad = parseInt(input.value) || 1;
        
        if (carrito[index]) {
            carrito[index].cantidad = cantidad;
            total += parseFloat(carrito[index].precio) * cantidad;
        }
    });

    guardarCarrito(carrito);

    // Actualizar la vista del total
    const totalEl = document.getElementById("carrito-total");
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(total).toLocaleString('es-CO')}</h2>`;
    }
    
    // Sincronizar con los campos ocultos de Wompi
    prepararPagoWompi(total);
}

function prepararPagoWompi(total) {
    const wompiAmountInput = document.getElementById('wompi-amount');
    const wompiReferenceInput = document.getElementById('wompi-reference');

    if (wompiAmountInput) {
        wompiAmountInput.value = Math.round(total * 100); // Centavos para Wompi
    }
    if (wompiReferenceInput && !wompiReferenceInput.value) {
        wompiReferenceInput.value = "MARCAS-" + Date.now();
    }
}

// === 3. Renderizado (Momento 1) ===
function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    const cartSection = document.getElementById("cart");
    const checkoutSection = document.getElementById("checkout");

    // Si el carrito está vacío
    if (carrito.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px;'>El carrito está vacío.</p>";
        if (totalEl) totalEl.innerHTML = "";
        if (checkoutSection) checkoutSection.classList.add("hidden");
        return;
    }

    let total = 0;

    // Generar el HTML de los productos
    list.innerHTML = carrito.map((p, i) => {
        const cantidad = p.cantidad || 1;
        const precio = parseFloat(p.precio) || 0;
        total += precio * cantidad;

        return `
            <div class="carrito-item" style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                <img src="${p.imagen}" alt="${p.titulo}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
                <div class="carrito-info" style="flex: 1;">
                    <h3 style="margin: 0; font-size: 1.1em;">${p.titulo}</h3>
                    <p style="margin: 5px 0; color: #666;">Precio: $${precio.toLocaleString('es-CO')}</p>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <label>Cant:</label>
                        <input type="number" class="cantidad" data-index="${i}" value="${cantidad}" min="1" style="width: 50px; padding: 5px;">
                    </div>
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})" style="background: none; border: none; color: red; cursor: pointer; font-size: 1.2em;">❌</button>
            </div>
        `;
    }).join("");

    // Actualizar el total en pantalla
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(total).toLocaleString('es-CO')}</h2>`;
    }

    prepararPagoWompi(total);

    // RE-ASIGNAR EVENTOS (Porque los elementos son nuevos)
    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("input", actualizarTotales);
    });
}

// === 4. Navegación y Eventos Globales ===
document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const cartSection = document.getElementById("cart");
    const checkoutSection = document.getElementById("checkout");

    // Evento para ir al Checkout (Momento 2)
    const btnContinuar = document.getElementById("btn-continuar-checkout");
    if (btnContinuar) {
        btnContinuar.addEventListener("click", () => {
            cartSection.classList.add("hidden");
            checkoutSection.classList.remove("hidden");
            window.scrollTo(0, 0);
        });
    }

    // Evento para volver al Carrito (Momento 1)
    const btnVolver = document.getElementById("btn-volver-carrito");
    if (btnVolver) {
        btnVolver.addEventListener("click", () => {
            checkoutSection.classList.add("hidden");
            cartSection.classList.remove("hidden");
        });
    }
});
