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
    
    // Actualización inmediata del monto tras eliminar
    let nuevoTotal = 0;
    getCarrito().forEach(p => {
        nuevoTotal += parseFloat(p.precio) * (p.cantidad || 1);
    });
    actualizarMontoWompi(nuevoTotal);
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

    actualizarMontoWompi(total); 
}

function renderCarrito() {
    let carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p>Tu carrito está vacío.</p>";
        if (totalEl) totalEl.textContent = "";
        return;
    }

    let total = 0;

    list.innerHTML = carrito.map((p, i) => {
        if (!p.cantidad) p.cantidad = 1;
        total += parseFloat(p.precio) * p.cantidad;

        return `
            <div class="carrito-item" style="border-bottom: 1px solid #eee; padding: 15px 0; display: flex; align-items: center; gap: 15px;">
                <img src="${p.imagen}" alt="${p.titulo}" style="width: 70px; border-radius: 5px;">
                <div class="carrito-info" style="flex-grow: 1;">
                    <h3 style="margin: 0; font-size: 1rem;">${p.titulo}</h3>
                    <p style="margin: 5px 0;">Price: $${parseFloat(p.precio).toLocaleString()}</p>
                    <label>Cant: 
                        <input type="number" id="cantidad-${i}" class="cantidad" value="${p.cantidad}" min="1" style="width: 45px;">
                    </label>
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})" style="background: none; border: none; cursor: pointer; color: #ff4d4d; font-size: 1.2rem;">❌</button>
            </div>
        `;
    }).join("");

    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${total.toLocaleString()}</h2>`;
    }

    actualizarMontoWompi(total);

    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("input", actualizarTotales);
    });
}

// === Función Maestra para Wompi ===
function actualizarMontoWompi(total) {
    const totalCentavos = Math.round(total * 100);
    const scriptWompi = document.getElementById('wompi-button');
    
    if (scriptWompi) {
        scriptWompi.setAttribute('data-amount-in-cents', totalCentavos);
        // Referencia única para evitar bloqueos de Wompi
        const referencia = "MC-" + Math.floor(Date.now() / 1000);
        scriptWompi.setAttribute('data-reference', referencia);
        console.log("Wompi sincronizado con $" + total);
    }
}

// === Control de Navegación y Eventos ===
document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const btnContinuar = document.getElementById("continuar");
    if (btnContinuar) {
        btnContinuar.addEventListener("click", () => {
            // Esto obliga a la sección a mostrarse eliminando la restricción
            const checkoutSection = document.getElementById("checkout");
            checkoutSection.classList.remove("hidden");
            checkoutSection.style.display = "block";

            document.getElementById("cart").style.display = "none";

            // Re-renderizamos Wompi para que aparezca
            actualizarTotales();
            
            const carritoCheck = getCarrito();
            if (carritoCheck.length > 0) {
                // Ocultar carrito y mostrar formulario/pago
                document.getElementById("cart").style.display = "none";
                document.getElementById("checkout").classList.remove("hidden");
                // Asegurar que el monto sea el correcto al abrir
                actualizarTotales();
            } else {
                alert("Primero debes añadir productos al carrito.");
            }
        });
    }

    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", (e) => {
            e.preventDefault();
            console.log("Datos de envío listos.");
        });
    }
});
