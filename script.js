// CONFIGURACIÓN INICIAL
const STORAGE_KEY = "carrito";

// 1. Obtener datos del carrito
function getCarrito() { 
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; 
}

// 2. Guardar datos y refrescar visualmente
function guardarCarrito(carrito) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    renderCarrito(); 
    if (typeof actualizarContador === 'function') actualizarContador();
}

// --- AJUSTE 1: MODIFICAR CANTIDADES ---
function cambiarCantidad(index, delta) {
    const carrito = getCarrito();
    // Sumamos o restamos al valor actual
    carrito[index].cantidad = (carrito[index].cantidad || 1) + delta;
    
    // Si la cantidad llega a 0, eliminamos el producto
    if (carrito[index].cantidad < 1) {
        carrito.splice(index, 1);
    }
    
    guardarCarrito(carrito);
}

// 3. Renderizar el carrito (Con botones de + y -)
function renderCarrito() {
    const carrito = getCarrito();
    const contenedor = document.getElementById("carrito-productos");
    const totalEl = document.getElementById("carrito-total");
    
    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = "<p style='text-align:center; padding:20px;'>Tu cesta está vacía</p>";
        if (totalEl) totalEl.innerHTML = "$0";
        return;
    }

    let total = 0;
    contenedor.innerHTML = carrito.map((p, index) => {
        const subtotal = p.precio * (p.cantidad || 1);
        total += subtotal;
        return `
            <div class="carrito-item" style="display:flex; align-items:center; gap:10px; padding:10px; border-bottom:1px solid #eee;">
                <img src="${p.imagen}" style="width:50px; height:50px; object-fit:cover; border-radius:5px;">
                <div style="flex-grow:1;">
                    <h4 style="margin:0; font-size:0.9rem;">${p.titulo}</h4>
                    <p style="margin:2px 0; color:green; font-weight:bold;">$${p.precio.toLocaleString()}</p>
                    <div style="display:flex; align-items:center; gap:8px;">
                        <button onclick="cambiarCantidad(${index}, -1)" style="width:25px; cursor:pointer;">-</button>
                        <span>${p.cantidad || 1}</span>
                        <button onclick="cambiarCantidad(${index}, 1)" style="width:25px; cursor:pointer;">+</button>
                    </div>
                </div>
                <strong>$${subtotal.toLocaleString()}</strong>
            </div>
        `;
    }).join("");

    if (totalEl) totalEl.innerHTML = `$${total.toLocaleString()}`;
}

// --- AJUSTE 2: LLAVE DE TEST PARA PRUEBAS ---
async function irAPagarWompi() {
    const carrito = getCarrito();
    if (carrito.length === 0) return alert("El carrito está vacío");

    let total = 0;
    carrito.forEach(p => total += (p.precio * (p.cantidad || 1)));
    
    const totalCentavos = Math.floor(total * 100);
    const referencia = "TEST-" + Date.now();
    
    // USANDO LLAVE DE TEST (Cambiar a pub_prod... cuando lances oficialmente)
    const llavePublica = "pub_test_Q5yS9J9ps9as03XpI89m266C7Uo6874e"; 

    // URL simplificada para pruebas (Sin firma de integridad obligatoria)
    const urlWompi = `https://checkout.wompi.co/p/?public-key=${llavePublica}&currency=COP&amount-in-cents=${totalCentavos}&reference=${referencia}`;
    
    window.location.href = urlWompi;
}

// LÓGICA DE AGREGAR (Manteniendo tu estructura original)
function agregarAlCarrito(titulo, precio, imagen) {
    let carrito = getCarrito();
    const existe = carrito.find(i => i.titulo === titulo);
    
    if (existe) {
        existe.cantidad++;
    } else {
        carrito.push({ titulo, precio, imagen, cantidad: 1 });
    }
    
    guardarCarrito(carrito);
    
    // Abrir el modal de la cesta si existe en tu index
    const overlay = document.getElementById("carrito-overlay");
    if (overlay) overlay.style.display = "flex";
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();
    
    // Vincular el botón de pago si existe
    const btnPago = document.getElementById("continuar-compra");
    if (btnPago) btnPago.onclick = irAPagarWompi;
});
