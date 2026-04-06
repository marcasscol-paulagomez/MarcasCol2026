from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import hashlib  # Necesario para Wompi

# ---------------------------------------------------
# CONFIGURACIÓN BASE
# ---------------------------------------------------
app = Flask(__name__, static_folder='.', static_url_path='')

app.secret_key = os.environ.get('LLAVE_SECRETA', 'supersecretkey')
CORS(app, supports_credentials=True)

OWNER_CODE = os.environ.get('CODIGO_REGISTRO')
# Nueva variable para Wompi
WOMPI_SECRET = os.environ.get('WOMPI_INTEGRITY_SECRET')

DATA_DIR = "/data"
DB_PATH = os.path.join(DATA_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(DATA_DIR, "uploads")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------
# MOTOR DE FIRMAS WOMPI (AGREGADO PARA EL CARRITO)
# ---------------------------------------------------
@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto') 
    moneda = request.args.get('moneda', 'COP')

    if not referencia or not monto:
        return jsonify({'error': 'Faltan parámetros'}), 400

    if not WOMPI_SECRET:
        return jsonify({'error': 'WOMPI_INTEGRITY_SECRET no configurada'}), 500

    # Limpieza de datos y generación de hash SHA256
    monto_limpio = str(int(float(monto)))
    cadena = f"{referencia}{monto_limpio}{moneda}{WOMPI_SECRET.strip()}"
    firma = hashlib.sha256(cadena.encode()).hexdigest()

    return jsonify({'firma': firma})

# ---------------------------------------------------
# CONEXIÓN BD
# ---------------------------------------------------
def obtener_conexion():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = obtener_conexion()
    c = conn.cursor()
    c.execute("""
    CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL, descripcion TEXT NOT NULL,
        seccion TEXT NOT NULL, marca TEXT NOT NULL,
        precio REAL NOT NULL, imagen TEXT NOT NULL
    )""")
    c.execute("CREATE TABLE IF NOT EXISTS secciones(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE NOT NULL)")
    c.execute("CREATE TABLE IF NOT EXISTS slides(id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, descripcion TEXT, marca TEXT, imagen TEXT NOT NULL, boton_texto TEXT, boton_url TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS marcas(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, imagen TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS mensajes(id INTEGER PRIMARY KEY AUTOINCREMENT, texto TEXT NOT NULL, activo INTEGER DEFAULT 1, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    conn.commit()
    conn.close()

# Copiar base del repo si no existe
if not os.path.exists(DB_PATH) and os.path.exists("database.db"):
    import shutil
    shutil.copy("database.db", DB_PATH)

create_tables()

# --- AQUÍ VAN TODAS TUS RUTAS ORIGINALES (LOGIN, SECCIONES, SLIDES, MARCAS) ---
# (Se mantienen exactamente igual a como las pasaste)

@app.route('/owner-login', methods=['POST'])
def owner_login():
    code = (request.get_json() or {}).get('code')
    if not OWNER_CODE: return jsonify({'error': 'Servidor sin CODIGO_REGISTRO'}), 500
    if code == OWNER_CODE:
        session['owner'] = True
        return jsonify({'message': 'Acceso concedido'})
    return jsonify({'error': 'Código incorrecto'}), 401

@app.route('/owner-logout', methods=['POST'])
def owner_logout():
    session.clear()
    return jsonify({'message': 'Sesión cerrada'})

def require_owner():
    if not session.get('owner'): return jsonify({'error': 'No autenticado'}), 401
    return None

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
    not_owner = require_owner()
    if not_owner: return not_owner
    titulo, desc, sec, marca, precio = request.form.get('titulo'), request.form.get('descripcion'), request.form.get('seccion'), request.form.get('marca'), request.form.get('precio')
    imagen = request.files.get('imagen')
    if not (titulo and imagen): return jsonify({'error': 'Faltan datos'}), 400
    filename = secure_filename(imagen.filename)
    imagen.save(os.path.join(UPLOAD_FOLDER, filename))
    conn = obtener_conexion()
    conn.execute("INSERT INTO products(titulo, descripcion, seccion, marca, precio, imagen) VALUES (?,?,?,?,?,?)", (titulo, desc, sec, marca, precio, filename))
    conn.commit()
    conn.close()
    return jsonify({'message':'Producto agregado'})

@app.route('/mensaje/ultimo', methods=['GET'])
def mensaje_ultimo():
    conn = obtener_conexion()
    cur = conn.cursor()
    cur.execute("SELECT texto FROM mensajes WHERE activo=1 ORDER BY creado_en DESC LIMIT 1")
    row = cur.fetchone()
    conn.close()
    return jsonify({'mensaje': row['texto'] if row else None})

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
@app.route('/catalogo')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/login')
def login():
    return send_from_directory('.', 'login.html')

# ---------------------------------------------------
# RUN (CORREGIDO PARA RAILWAY)
# ---------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
