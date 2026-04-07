from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import hashlib

# ---------------------------------------------------
# CONFIGURACIÓN E INICIALIZACIÓN
# ---------------------------------------------------
app = Flask(__name__, static_folder='.', static_url_path='')

# Variables de entorno de Railway
app.secret_key = os.environ.get('LLAVE_SECRETA', 'supersecretkey_marcascol_2026')
WOMPI_SECRET = os.environ.get('WOMPI_INTEGRITY_SECRET')

CORS(app, supports_credentials=True)

# Rutas de persistencia (Volumen de Railway)
DATA_DIR = "/data"
DB_PATH = os.path.join(DATA_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(DATA_DIR, "uploads")

# Asegurar que las carpetas existan
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------
# BASE DE DATOS (Creación automática de tablas)
# ---------------------------------------------------
def obtener_conexion():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Crea las tablas si no existen al arrancar el servidor"""
    conn = obtener_conexion()
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                titulo TEXT NOT NULL,
                descripcion TEXT,
                seccion TEXT,
                marca TEXT,
                precio REAL NOT NULL,
                imagen TEXT NOT NULL
            )
        """)
        conn.commit()
    except Exception as e:
        print(f"Error inicializando BD: {e}")
    finally:
        conn.close()

# Ejecutar la creación de tablas
init_db()

# ---------------------------------------------------
# MOTOR DE FIRMAS WOMPI
# ---------------------------------------------------
@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto') # Viene en centavos desde el JS
    moneda = request.args.get('moneda', 'COP')
    
    if not referencia or not monto:
        return jsonify({'error': 'Faltan parámetros de transacción'}), 400
    
    if not WOMPI_SECRET:
        return jsonify({'error': 'Servidor no configurado con WOMPI_INTEGRITY_SECRET'}), 500

    # Limpieza de monto (debe ser string sin decimales para la firma)
    monto_centavos = str(int(float(monto)))
    
    # Cadena de integridad: referencia + monto + moneda + secreto
    cadena_unida = f"{referencia}{monto_centavos}{moneda}{WOMPI_SECRET.strip()}"
    firma = hashlib.sha256(cadena_unida.encode()).hexdigest()
    
    return jsonify({'firma': firma})

# ---------------------------------------------------
# API DE PRODUCTOS
# ---------------------------------------------------
@app.route('/products', methods=['GET'])
def get_products():
    try:
        conn = obtener_conexion()
        query = "SELECT * FROM products ORDER BY id DESC"
        rows = conn.execute(query).fetchall()
        conn.close()
        
        productos = [dict(row) for row in rows]
        # Ajustar la ruta de la imagen para que sea accesible
        for p in productos:
            p['imagen'] = f"/uploads/{p['imagen']}"
            
        return jsonify(productos)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/product', methods=['POST'])
def add_product():
    # Nota: Aquí podrías añadir validación de session.get('owner') si activas el login
    try:
        titulo = request.form.get('titulo')
        descripcion = request.form.get('descripcion')
        seccion = request.form.get('seccion')
        marca = request.form.get('marca')
        precio = request.form.get('precio')
        img = request.files.get('imagen')

        if not (titulo and precio and img):
            return jsonify({'error': 'Datos obligatorios faltantes'}), 400

        fname = secure_filename(img.filename)
        img.save(os.path.join(UPLOAD_FOLDER, fname))

        conn = obtener_conexion()
        conn.execute("""
            INSERT INTO products (titulo, descripcion, seccion, marca, precio, imagen)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (titulo, descripcion, seccion, marca, precio, fname))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Producto agregado con éxito'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ---------------------------------------------------
# RUTAS DE ARCHIVOS Y PÁGINAS
# ---------------------------------------------------
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
@app.route('/catalogo')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/carrito.html')
def cart_page():
    return send_from_directory('.', 'carrito.html')

@app.route('/login')
def login():
    return send_from_directory('.', 'login.html')

# ---------------------------------------------------
# ARRANQUE (RAILWAY)
# ---------------------------------------------------
if __name__ == '__main__':
    # Railway inyecta el puerto automáticamente
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
