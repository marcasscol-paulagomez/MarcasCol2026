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

    document.querySelectorAll(".carrito-item").forEach((item, i) => {
        const cantidadInput = item.querySelector(".cantidad");
        if (cantidadInput && carrito[i]) {
            const cantidad = parseInt(cantidadInput.value);
            total += carrito[i].precio * cantidad;
            carrito[i].cantidad = cantidad;
        }
    });

    guardarCarrito(carrito);

    const totalEl = document.getElementById("carrito-total");
    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${total.toLocaleString()}</h2>`;
    }

    // Actualizamos Wompi cada vez que cambian los totales
    actualizarMontoWompi(total); 
}

function renderCarrito() {
    let carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p>El carrito está vacío.</p>";
        if (totalEl) totalEl.textContent = "";
        return;
    }

    let total = 0;

    list.innerHTML = carrito.map((p, i) => {
        if (!p.cantidad) p.cantidad = 1;
        total += parseFloat(p.precio) * p.cantidad;

        return `
            <div class="carrito-item">
                <img src="${p.imagen}" alt="${p.titulo}">
                <div class="carrito-info">
                    <h3>${p.titulo}</h3>
                    <p><strong>Precio:</strong> $${p.precio}</p>
                    <p><strong>Marca:</strong> ${p.marca}</p>
                    <p>${p.descripcion}</p>
                    <label for="cantidad-${i}">Cantidad:</label>
                    <input type="number" id="cantidad-${i}" class="cantidad" value="${p.cantidad}" min="1">
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})">❌ Eliminar</button>
            </div>
        `;
    }).join("");

    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${total.toLocaleString()}</h2>`;
    }

    // Actualizamos Wompi al cargar el carrito
    actualizarMontoWompi(total);

    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("input", actualizarTotales);
    });
}

// === Función para conectar con Wompi ===
function actualizarMontoWompi(total) {
    const totalCentavos = Math.round(total * 100);
    const scriptWompi = document.getElementById('wompi-button');
    
    if (scriptWompi) {
        scriptWompi.setAttribute('data-amount-in-cents', totalCentavos);
        const referencia = "MC-" + Math.floor(Date.now() / 1000);
        scriptWompi.setAttribute('data-reference', referencia);
        console.log("Wompi listo para cobrar: " + totalCentavos + " centavos.");
    }
}

// === Eventos ===
document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const btnContinuar = document.getElementById("continuar");
    if (btnContinuar) {
        btnContinuar.addEventListener("click", () => {
            document.getElementById("cart").classList.add("hidden");
            document.getElementById("checkout").classList.remove("hidden");
        });
    }

    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", (e) => {
            // No hacemos e.preventDefault() aquí si queremos que Wompi procese, 
            // pero como el botón de Wompi es independiente, este form es solo para tus datos.
            console.log("Datos de envío registrados.");
        });
    }
});
