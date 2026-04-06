from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import hashlib

# ---------------------------------------------------
# CONFIGURACIÓN BASE
# ---------------------------------------------------
app = Flask(__name__, static_folder='.', static_url_path='')

app.secret_key = os.environ.get('LLAVE_SECRETA', 'supersecretkey')
CORS(app, supports_credentials=True)

OWNER_CODE = os.environ.get('CODIGO_REGISTRO')
WOMPI_SECRET = os.environ.get('WOMPI_INTEGRITY_SECRET')

DATA_DIR = "/data"
DB_PATH = os.path.join(DATA_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(DATA_DIR, "uploads")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------
# MOTOR DE FIRMAS WOMPI
# ---------------------------------------------------
def generar_firma_wompi(referencia, monto_en_centavos, moneda):
    if not WOMPI_SECRET: return None
    monto_limpio = str(int(float(monto_en_centavos)))
    cadena = f"{referencia}{monto_limpio}{moneda}{WOMPI_SECRET.strip()}"
    return hashlib.sha256(cadena.encode()).hexdigest()

@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto')
    moneda = request.args.get('moneda', 'COP')
    if not referencia or not monto: return jsonify({'error': 'Faltan parámetros'}), 400
    firma = generar_firma_wompi(referencia, monto, moneda)
    if not firma: return jsonify({'error': 'WOMPI_INTEGRITY_SECRET no configurada'}), 500
    return jsonify({'firma': firma})

# ---------------------------------------------------
# CONEXIÓN BD Y TABLAS
# ---------------------------------------------------
def obtener_conexion():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = obtener_conexion()
    c = conn.cursor()
    c.execute("CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, descripcion TEXT NOT NULL, seccion TEXT NOT NULL, marca TEXT NOT NULL, precio REAL NOT NULL, imagen TEXT NOT NULL)")
    c.execute("CREATE TABLE IF NOT EXISTS secciones(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE NOT NULL)")
    c.execute("CREATE TABLE IF NOT EXISTS slides(id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL, descripcion TEXT, marca TEXT, imagen TEXT NOT NULL, boton_texto TEXT, boton_url TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS marcas(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, imagen TEXT)")
    c.execute("CREATE TABLE IF NOT EXISTS mensajes(id INTEGER PRIMARY KEY AUTOINCREMENT, texto TEXT NOT NULL, activo INTEGER DEFAULT 1, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP)")
    conn.commit()
    conn.close()

if not os.path.exists(DB_PATH) and os.path.exists("database.db"):
    import shutil
    shutil.copy("database.db", DB_PATH)

create_tables()

# ---------------------------------------------------
# RUTAS DE PRODUCTOS (Corregida la carga de imágenes)
# ---------------------------------------------------
@app.route('/products', methods=['GET'])
def get_products():
    conn = obtener_conexion()
    productos = [dict(row) for row in conn.execute("SELECT * FROM products ORDER BY id DESC").fetchall()]
    conn.close()
    for p in productos:
        p['imagen'] = f"/uploads/{p['imagen']}"
    return jsonify(productos)

@app.route('/product', methods=['POST'])
def add_product():
    if not session.get('owner'): return jsonify({'error': 'No auth'}), 401
    t, d, s, m, p = request.form.get('titulo'), request.form.get('descripcion'), request.form.get('seccion'), request.form.get('marca'), request.form.get('precio')
    img = request.files.get('imagen')
    if not (t and img): return jsonify({'error': 'Faltan datos'}), 400
    fname = secure_filename(img.filename)
    img.save(os.path.join(UPLOAD_FOLDER, fname))
    conn = obtener_conexion()
    conn.execute("INSERT INTO products(titulo, descripcion, seccion, marca, precio, imagen) VALUES (?,?,?,?,?,?)", (t,d,s,m,p,fname))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Ok'})

# ---------------------------------------------------
# RUTAS DE PÁGINAS (¡Aquí está el truco!)
# ---------------------------------------------------
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
@app.route('/catalogo')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/carrito.html') # NUEVA RUTA PARA EL CARRITO
def ver_carrito():
    return send_from_directory('.', 'carrito.html')

@app.route('/login')
def login():
    return send_from_directory('.', 'login.html')

@app.route('/owner-login', methods=['POST'])
def owner_login():
    code = (request.get_json() or {}).get('code')
    if code == OWNER_CODE:
        session['owner'] = True
        return jsonify({'message': 'Ok'})
    return jsonify({'error': 'Error'}), 401

# ---------------------------------------------------
# ARRANQUE PARA RAILWAY
# ---------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
