// === Funciones del carrito ===
function getCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

function eliminarDelCarrito(index) {
    let carrito = getCarrito();
    carrito.splice(index, 1); // Elimina 1 producto en la posición index
    guardarCarrito(carrito);
    renderCarrito();
}

function actualizarTotales() {
    const carrito = getCarrito();
    let total = 0;

    document.querySelectorAll(".carrito-item").forEach((item, i) => {
        const cantidad = parseInt(item.querySelector(".cantidad").value);
        total += carrito[i].precio * cantidad;
        // actualizamos la cantidad dentro del localStorage también
        carrito[i].cantidad = cantidad;
    });

    guardarCarrito(carrito);

    const totalEl = document.getElementById("carrito-total");
    totalEl.innerHTML = `<h2>Total a pagar: $${total.toFixed(2)}</h2>`;
    // === AGREGAR ESTA LÍNEA PARA WOMPI ===
    actualizarMontoWompi(total); 
}

function renderCarrito() {
    let carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (carrito.length === 0) {
        list.innerHTML = "<p>El carrito está vacío.</p>";
        totalEl.textContent = "";
        return;
        // ... código anterior de renderCarrito ...
    actualizarMontoWompi(total); 
    }

    let total = 0;

    list.innerHTML = carrito.map((p, i) => {
        // si no tiene cantidad en memoria, inicializamos en 1
        if (!p.cantidad) p.cantidad = 1;

        total += parseFloat(p.precio) * p.cantidad;

        return `
            <div class="carrito-item">
                <img src="${p.imagen}" alt="${p.titulo}">
                <div class="carrito-info">
                    <h3>${p.titulo}</h3>
                    <p><strong>Precio:</strong> $${p.precio}</p>
                    <p><strong>Marca:</strong> ${p.marca}</p>
                    <p><strong>Sección:</strong> ${p.seccion}</p>
                    <p>${p.descripcion}</p>

                    <!-- NUEVO input cantidad -->
                    <label for="cantidad-${i}">Cantidad:</label>
                    <input type="number" id="cantidad-${i}" class="cantidad" 
                           value="${p.cantidad}" min="1">
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})">❌ Eliminar</button>
            </div>
        `;
    }).join("");

    totalEl.innerHTML = `<h2>Total a pagar: $${total.toFixed(2)}</h2>`;

    // eventos para inputs de cantidad
    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener("input", actualizarTotales);
    });
}

// === Eventos ===
document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    // Mostrar el formulario al presionar continuar
    document.getElementById("continuar").addEventListener("click", () => {
        document.getElementById("cart").classList.add("hidden");
        document.getElementById("checkout").classList.remove("hidden");
    });

    // Manejo del formulario de checkout
    document.getElementById("checkout-form").addEventListener("submit", (e) => {
        e.preventDefault();
        let nombre = document.getElementById("nombre").value;
        let direccion = document.getElementById("direccion").value;
        let barrio = document.getElementById("barrio").value;
        let telefono = document.getElementById("telefono").value;
        let pago = document.getElementById("pago").value;

        // Mensaje de confirmación
        alert(`✅ Pedido confirmado\n\nNombre: ${nombre}\nDirección: ${direccion}\nBarrio: ${barrio}\nTeléfono: ${telefono}\nMétodo de pago: ${pago}`);

        // Vaciar carrito en localStorage
        localStorage.removeItem("carrito");

        // Regresar al carrito vacío
        document.getElementById("checkout").classList.add("hidden");
        document.getElementById("cart").classList.remove("hidden");
        renderCarrito();

        // Función para conectar el total del carrito con Wompi
        function actualizarMontoWompi(total) {
         const totalCentavos = Math.round(total * 100);
          const scriptWompi = document.getElementById('wompi-button');
    
        if (scriptWompi) {
        scriptWompi.setAttribute('data-amount-in-cents', totalCentavos);
        
        // Generamos una referencia única basada en la hora actual
        const referencia = "MC-" + Math.floor(Date.now() / 1000);
        scriptWompi.setAttribute('data-reference', referencia);
    });
});
