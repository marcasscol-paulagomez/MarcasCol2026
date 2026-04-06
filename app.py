from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import hashlib

# ---------------------------------------------------
# 1. CONFIGURACIÓN E INICIALIZACIÓN
# ---------------------------------------------------
app = Flask(__name__, static_folder='.', static_url_path='')

# Variables de entorno de Railway
app.secret_key = os.environ.get('LLAVE_SECRETA', 'supersecretkey')
OWNER_CODE = os.environ.get('CODIGO_REGISTRO')
WOMPI_SECRET = os.environ.get('WOMPI_INTEGRITY_SECRET')

CORS(app, supports_credentials=True)

# Configuración de persistencia (Railway Volumes)
DATA_DIR = "/data"
DB_PATH = os.path.join(DATA_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(DATA_DIR, "uploads")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------
# 2. MOTOR DE FIRMAS WOMPI (Para el Carrito)
# ---------------------------------------------------
@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto') 
    moneda = request.args.get('moneda', 'COP')

    if not referencia or not monto:
        return jsonify({'error': 'Faltan parámetros'}), 400

    if not WOMPI_SECRET:
        return jsonify({'error': 'WOMPI_INTEGRITY_SECRET no configurada en Railway'}), 500

    # Limpieza: Wompi no acepta decimales en la firma
    monto_limpio = str(int(float(monto)))
    # Cadena: referencia + monto + moneda + secreto
    cadena = f"{referencia}{monto_limpio}{moneda}{WOMPI_SECRET.strip()}"
    firma = hashlib.sha256(cadena.encode()).hexdigest()

    return jsonify({'firma': firma})

# ---------------------------------------------------
# 3. BASE DE DATOS Y TABLAS
# ---------------------------------------------------
def obtener_conexion():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = obtener_conexion()
    c = conn.cursor()
    # Tabla de Productos
    c.execute("""CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL, descripcion TEXT NOT NULL,
        seccion TEXT NOT NULL, marca TEXT NOT NULL,
        precio REAL NOT NULL, imagen TEXT NOT NULL
    )""")
    # Otras tablas
    c.execute("CREATE TABLE IF NOT EXISTS secciones(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE NOT NULL)")
    c.execute("CREATE TABLE IF NOT EXISTS slides(id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, imagen TEXT NOT NULL)")
    c.execute("CREATE TABLE IF NOT EXISTS marcas(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, imagen TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS mensajes(id INTEGER PRIMARY KEY AUTOINCREMENT, texto TEXT NOT NULL, activo INTEGER DEFAULT 1, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    conn.commit()
    conn.close()

# Copiar base de datos inicial si existe en el repo
if not os.path.exists(DB_PATH) and os.path.exists("database.db"):
    import shutil
    shutil.copy("database.db", DB_PATH)

create_tables()

# ---------------------------------------------------
# 4. RUTAS DE LA TIENDA (PRODUCTOS Y CATALOGO)
# ---------------------------------------------------
@app.route('/products', methods=['GET'])
def get_products():
    conn = obtener_conexion()
    cur = conn.cursor()
    cur.execute("SELECT * FROM products ORDER BY id DESC")
    productos = [dict(row) for row in cur.fetchall()]
    conn.close()
    for p in productos:
        p['imagen'] = f"/uploads/{p['imagen']}"
    return jsonify(productos)

@app.route('/product', methods=['POST'])
def add_product():
    if not session.get('owner'): return jsonify({'error': 'No auth'}), 401
    titulo = request.form.get('titulo')
    desc = request.form.get('descripcion')
    sec = request.form.get('seccion')
    mar = request.form.get('marca')
    pre = request.form.get('precio')
    img = request.files.get('imagen')
    
    if not (titulo and img): return jsonify({'error': 'Faltan datos'}), 400
    
    fname = secure_filename(img.filename)
    img.save(os.path.join(UPLOAD_FOLDER, fname))
    
    conn = obtener_conexion()
    conn.execute("INSERT INTO products(titulo, descripcion, seccion, marca, precio, imagen) VALUES (?,?,?,?,?,?)", 
                 (titulo, desc, sec, mar, pre, fname))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Producto agregado'})

@app.route('/mensaje/ultimo', methods=['GET'])
def mensaje_ultimo():
    conn = obtener_conexion()
    row = conn.execute("SELECT texto FROM mensajes WHERE activo=1 ORDER BY creado_en DESC LIMIT 1").fetchone()
    conn.close()
    return jsonify({'mensaje': row['texto'] if row else None})

# ---------------------------------------------------
# 5. ADMINISTRACIÓN Y RUTAS ESTÁTICAS
# ---------------------------------------------------
@app.route('/owner-login', methods=['POST'])
def owner_login():
    code = (request.get_json() or {}).get('code')
    if code == OWNER_CODE:
        session['owner'] = True
        return jsonify({'message': 'Acceso concedido'})
    return jsonify({'error': 'Incorrecto'}), 401

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
@app.route('/catalogo')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/login')
def login_page():
    return send_from_directory('.', 'login.html')

# ---------------------------------------------------
# 6. ARRANQUE (RAILWAY)
# ---------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
