const STORAGE_KEY = "carrito";

// 1. Obtener datos del carrito desde localStorage
function getCarrito() { 
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; 
}

// 2. Guardar datos y refrescar la vista
function guardarCarrito(carrito) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    renderCarrito(); 
}

// 3. Cambiar cantidad de un producto (+1 o -1)
function cambiarCantidad(index, delta) {
    const carrito = getCarrito();
    carrito[index].cantidad = (carrito[index].cantidad || 1) + delta;
    
    if (carrito[index].cantidad < 1) {
        eliminarProducto(index);
    } else {
        guardarCarrito(carrito);
    }
}

// 4. Eliminar producto del carrito
function eliminarProducto(index) {
    const carrito = getCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
}

// 5. Dibujar el carrito en el HTML
function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    const btnCont = document.getElementById("continuar");

    if (!list) return;

    // Caso: Carrito vacío
    if (carrito.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <p>El carrito está vacío.</p>
                <a href="index.html" style="color:#000; text-decoration:underline;">Volver a la tienda</a>
            </div>`;
        if (totalEl) totalEl.innerHTML = "";
        if (btnCont) btnCont.style.display = "none";
        return;
    }

    // Mostrar botón de continuar si hay items
    if (btnCont) btnCont.style.display = "block";

    let total = 0;
    list.innerHTML = carrito.map((p, index) => {
        const precioNum = parseFloat(p.precio) || 0;
        const subtotal = precioNum * (p.cantidad || 1);
        total += subtotal;
        
        return `
            <div class="carrito-item">
                <img src="${p.imagen}" alt="${p.titulo}">
                <div class="carrito-info">
                    <h4>${p.titulo}</h4>
                    <p>$${precioNum.toLocaleString()}</p>
                    <div style="display:flex; align-items:center; gap:10px; margin-top:5px;">
                        <button onclick="cambiarCantidad(${index}, -1)" class="btn-cantidad">-</button>
                        <span>${p.cantidad || 1}</span>
                        <button onclick="cambiarCantidad(${index}, 1)" class="btn-cantidad">+</button>
                        <button onclick="eliminarProducto(${index})" style="margin-left:15px; color:red; border:none; background:none; cursor:pointer; font-size:0.8rem;">Eliminar</button>
                    </div>
                </div>
                <div style="font-weight:bold;">$${subtotal.toLocaleString()}</div>
            </div>`;
    }).join("");

    if (totalEl) {
        totalEl.innerHTML = `
            <button onclick="if(confirm('¿Vaciar todo el carrito?')) { localStorage.removeItem('${STORAGE_KEY}'); renderCarrito(); }" 
                    style="background:none; border:none; color:#666; cursor:pointer; text-decoration:underline; font-size:0.8rem;">
                Vaciar Carrito
            </button>
            <strong>Total a pagar: $${total.toLocaleString()}</strong>`;
    }
}

// 6. Procesar Pago con Firma de Seguridad (Wompi)
async function irAPagarWompi() {
    const carrito = getCarrito();
    if (carrito.length === 0) return alert("Tu carrito está vacío");

    let total = 0;
    carrito.forEach(p => total += (parseFloat(p.precio) || 0) * (p.cantidad || 1));
    
    // Wompi requiere el monto en centavos como un número entero
    const totalCentavos = Math.floor(total * 100);
    const referencia = "MC-" + Date.now();
    const moneda = "COP";
    const llavePublica = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    try {
        // Bloqueamos el botón visualmente o mostramos alerta de carga
        console.log("Solicitando firma al servidor...");

        // 1. Pedimos la firma al servidor de Railway
        const response = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${totalCentavos}&moneda=${moneda}`);
        
        if (!response.ok) throw new Error("Error en la respuesta del servidor");

        const data = await response.json();

        if (data.firma) {
            // 2. Redirigir a la pasarela de Wompi con la firma generada
            const urlWompi = `https://checkout.wompi.co/p/?public-key=${llavePublica}&currency=${moneda}&amount-in-cents=${totalCentavos}&reference=${referencia}&signature=${data.firma}`;
            window.location.href = urlWompi;
        } else {
            alert("Error: El servidor no pudo generar la firma de seguridad. Revisa las variables de entorno.");
        }
    } catch (error) {
        console.error("Error al conectar con el servidor:", error);
        alert("Hubo un problema al conectar con la pasarela de pagos. Verifica que el servidor esté activo.");
    }
}

// 7. Inicialización de eventos
document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();

    const btnContinuar = document.getElementById("continuar");
    if (btnContinuar) {
        btnContinuar.onclick = () => {
            // Ocultar sección de carrito y mostrar formulario de checkout
            const cartSec = document.getElementById("cart");
            const checkoutSec = document.getElementById("checkout");
            
            if (cartSec) cartSec.classList.add("hidden");
            if (checkoutSec) {
                checkoutSec.classList.remove("hidden");
                checkoutSec.style.display = "block";
            }

            // Inyectar el botón de pago final
            const container = document.getElementById("wompi-container");
            if (container) {
                container.innerHTML = `<button id="btn-pagar-real">PAGAR AHORA CON WOMPI</button>`;
                document.getElementById("btn-pagar-real").onclick = irAPagarWompi;
            }
        };
    }
});
