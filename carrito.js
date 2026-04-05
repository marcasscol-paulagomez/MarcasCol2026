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
                    <p style="margin: 5px 0;">Precio: $${parseFloat(p.precio).toLocaleString()}</p>
                    <label>Cant: 
                        <input type="number" id="cantidad-${i}" class="cantidad" value="${p.cantidad}" min="1" style="width: 45px;">
                    </label>
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})">❌</button>
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

function actualizarMontoWompi(total) {
    const totalCentavos = Math.round(total * 100);
    const scriptWompi = document.getElementById('wompi-button');
    
    if (scriptWompi) {
        scriptWompi.setAttribute('data-amount-in-cents', totalCentavos);
        const referencia = "MC-" + Math.floor(Date.now() / 1000);
        scriptWompi.setAttribute('data-reference', referencia);
        console.log("Wompi sincronizado: $" + total);
    }
}

// === Control de Navegación ===
document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const btnContinuar = document.getElementById("continuar");
    if (btnContinuar) {
        btnContinuar.addEventListener("click", () => {
            const carritoCheck = getCarrito();
            
            if (carritoCheck.length > 0) {
                // 1. Ocultar sección de carrito
                document.getElementById("cart").style.display = "none";
                
                // 2. Mostrar sección de checkout (quitar clase y forzar display)
                const checkoutSection = document.getElementById("checkout");
                checkoutSection.classList.remove("hidden");
                checkoutSection.style.display = "block";

                // 3. Actualizar montos para Wompi
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
        });
    }
});
