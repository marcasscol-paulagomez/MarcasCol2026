const STORAGE_KEY = "carrito";

function getCarrito() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }

function guardarCarrito(carrito) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    renderCarrito(); 
}

function cambiarCantidad(index, delta) {
    const carrito = getCarrito();
    carrito[index].cantidad = (carrito[index].cantidad || 1) + delta;
    if (carrito[index].cantidad < 1) {
        eliminarProducto(index);
    } else {
        guardarCarrito(carrito);
    }
}

function eliminarProducto(index) {
    const carrito = getCarrito();
    carrito.splice(index, 1);
    guardarCarrito(carrito);
}

function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = `
            <div style="text-align:center; padding:40px;">
                <p>El carrito está vacío.</p>
                <a href="index.html" style="color:#000; text-decoration:underline;">Volver a la tienda</a>
            </div>`;
        if (totalEl) totalEl.innerHTML = "";
        const btnCont = document.getElementById("continuar");
        if (btnCont) btnCont.style.display = "none";
        return;
    }

    const btnCont = document.getElementById("continuar");
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

    totalEl.innerHTML = `
        <button onclick="if(confirm('¿Vaciar todo el carrito?')) { localStorage.removeItem('${STORAGE_KEY}'); renderCarrito(); }" 
                style="background:none; border:none; color:#666; cursor:pointer; text-decoration:underline; font-size:0.8rem;">
            Vaciar Carrito
        </button>
        <strong>Total a pagar: $${total.toLocaleString()}</strong>`;
}

function irAPagarWompi() {
    const carrito = getCarrito();
    let total = 0;
    carrito.forEach(p => total += (parseFloat(p.precio) || 0) * (p.cantidad || 1));
    const totalCentavos = Math.floor(total * 100);
    const referencia = "MC-ORDER-" + Date.now();
    const llavePublica = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";
    const urlWompi = `https://checkout.wompi.co/p/?public-key=${llavePublica}&currency=COP&amount-in-cents=${totalCentavos}&reference=${referencia}`;
    window.location.href = urlWompi;
}

document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();
    const btnContinuar = document.getElementById("continuar");
    if (btnContinuar) {
        btnContinuar.onclick = () => {
            document.getElementById("cart").classList.add("hidden");
            const checkoutSec = document.getElementById("checkout");
            checkoutSec.classList.remove("hidden");
            checkoutSec.style.display = "block";
            const container = document.getElementById("wompi-container");
            container.innerHTML = `<button id="btn-pagar-real">PAGAR AHORA CON WOMPI</button>`;
            document.getElementById("btn-pagar-real").onclick = irAPagarWompi;
        };
    }
});
const STORAGE_KEY = "carrito";

function getCarrito() { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }

function renderCarrito() {
    const carrito = getCarrito();
    const list = document.getElementById("carrito-list");
    const totalEl = document.getElementById("carrito-total");
    if (!list) return;

    if (carrito.length === 0) {
        list.innerHTML = "<p style='text-align:center;'>Carrito vacío</p>";
        totalEl.innerHTML = "";
        return;
    }

    let total = 0;
    list.innerHTML = carrito.map((p, index) => {
        const subtotal = p.precio * (p.cantidad || 1);
        total += subtotal;
        return `
            <div class="carrito-item">
                <img src="${p.imagen}" width="50">
                <div class="carrito-info">
                    <h4>${p.titulo}</h4>
                    <p>$${subtotal.toLocaleString()}</p>
                </div>
            </div>`;
    }).join("");

    totalEl.innerHTML = `<strong>Total: $${total.toLocaleString()}</strong>`;
}

async function irAPagarWompi() {
    const carrito = getCarrito();
    let total = 0;
    carrito.forEach(p => total += (p.precio * (p.cantidad || 1)));
    
    const montoCentavos = Math.floor(total * 100);
    const referencia = "MC" + Date.now();
    const moneda = "COP";
    const llavePublica = "pub_prod_s6o6uRKmlae54oP8MP2gQihvJEkwxDae";

    try {
        const res = await fetch(`/obtener-firma-wompi?referencia=${referencia}&monto=${montoCentavos}&moneda=${moneda}`);
        const data = await res.json();

        if (data.firma) {
            window.location.href = `https://checkout.wompi.co/p/?public-key=${llavePublica}&currency=${moneda}&amount-in-cents=${montoCentavos}&reference=${referencia}&signature=${data.firma}`;
        } else {
            alert("Error de firma");
        }
    } catch (e) {
        alert("Error de conexión");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    renderCarrito();
    const btnPagar = document.getElementById("btn-pagar-real");
    if (btnPagar) btnPagar.onclick = irAPagarWompi;
    
    const btnContinuar = document.getElementById("continuar");
    if (btnContinuar) {
        btnContinuar.onclick = () => {
            document.getElementById("cart").classList.add("hidden");
            const checkout = document.getElementById("checkout");
            checkout.classList.remove("hidden");
            checkout.style.display = "block";
            document.getElementById("wompi-container").innerHTML = '<button id="btn-pagar-real">PAGAR AHORA</button>';
            document.getElementById("btn-pagar-real").onclick = irAPagarWompi;
        };
    }
});
