// === Funciones de Datos ===
function getCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem("carrito", JSON.stringify(carrito));
}

// === Lógica para evitar duplicados al agregar ===
// Esta función debe usarse en tu catálogo cuando el usuario hace clic en "Comprar"
function agregarAlCarrito(productoNuevo) {
    let carrito = getCarrito();
    
    // Buscamos si el producto ya existe por su título
    const indexExistente = carrito.findIndex(p => p.titulo === productoNuevo.titulo);

    if (indexExistente !== -1) {
        // Si ya existe, aumentamos la cantidad
        carrito[indexExistente].cantidad = (carrito[indexExistente].cantidad || 1) + 1;
    } else {
        // Si es nuevo, lo añadimos con cantidad 1
        productoNuevo.cantidad = 1;
        carrito.push(productoNuevo);
    }
    
    guardarCarrito(carrito);
    alert("Producto añadido al carrito");
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
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");

    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p style='text-align:center; padding:20px;'>Tu carrito está vacío.</p>";
        if (totalEl) totalEl.innerHTML = "";
        return;
    }

    let total = 0;
    list.innerHTML = carrito.map((p, i) => {
        const cantidad = p.cantidad || 1;
        const subtotal = parseFloat(p.precio) * cantidad;
        total += subtotal;

        return `
            <div class="carrito-item" style="display: flex; align-items: center; border-bottom: 1px solid #ddd; padding: 10px; margin-bottom: 10px;">
                <img src="${p.imagen}" alt="${p.titulo}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 5px; margin-right: 15px;">
                <div class="carrito-info" style="flex: 1;">
                    <h3 style="margin: 0; font-size: 1.1rem;">${p.titulo}</h3>
                    <p style="margin: 5px 0;"><strong>Precio:</strong> $${parseFloat(p.precio).toLocaleString('es-CO')}</p>
                    <label>Cantidad: </label>
                    <input type="number" class="cantidad" value="${cantidad}" min="1" data-index="${i}" style="width: 50px; padding: 5px;">
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${i})" style="background: none; border: none; color: red; cursor: pointer; font-size: 1.2rem;">❌</button>
            </div>
        `;
    }).join("");

    if (totalEl) {
        totalEl.innerHTML = `<h2>Total a pagar: $${Math.round(total).toLocaleString('es-CO')}</h2>`;
    }
    prepararPagoWompi(total);

    document.querySelectorAll(".cantidad").forEach(input => {
        input.addEventListener
