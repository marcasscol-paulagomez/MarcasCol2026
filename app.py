from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import hashlib

# ---------------------------------------------------
# CONFIGURACIÓN
# ---------------------------------------------------
app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = os.environ.get('LLAVE_SECRETA', 'supersecretkey')
CORS(app, supports_credentials=True)

OWNER_CODE = os.environ.get('CODIGO_REGISTRO')
WOMPI_SECRET = os.environ.get('WOMPI_INTEGRITY_SECRET')

# Rutas para Railway (Volumen persistente /data)
DATA_DIR = "/data"
DB_PATH = os.path.join(DATA_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def obtener_conexion():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ---------------------------------------------------
# SEGURIDAD WOMPI (FIRMA)
# ---------------------------------------------------
@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto')
    moneda = request.args.get('moneda', 'COP')
    
    if not WOMPI_SECRET:
        return jsonify({'error': 'WOMPI_INTEGRITY_SECRET no configurada'}), 500
    
    monto_limpio = str(int(float(monto)))
    cadena = f"{referencia}{monto_limpio}{moneda}{WOMPI_SECRET.strip()}"
    firma = hashlib.sha256(cadena.encode()).hexdigest()
    
    return jsonify({'firma': firma})

# ---------------------------------------------------
# PRODUCTOS
# ---------------------------------------------------
@app.route('/products', methods=['GET'])
def get_products():
    try:
        conn = obtener_conexion()
        # Crear tabla si no existe
        conn.execute("CREATE TABLE IF NOT EXISTS products(id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT, descripcion TEXT, seccion TEXT, marca TEXT, precio REAL, imagen TEXT)")
        productos = [dict(row) for row in conn.execute("SELECT * FROM products ORDER BY id DESC").fetchall()]
        conn.close()
        for p in productos:
            p['imagen'] = f"/uploads/{p['imagen']}"
        return jsonify(productos)
    except:
        return jsonify([])

@app.route('/product', methods=['POST'])
def add_product():
    t, d, s, m, p = request.form.get('titulo'), request.form.get('descripcion'), request.form.get('seccion'), request.form.get('marca'), request.form.get('precio')
    img = request.files.get('imagen')
    if not (t and img): return jsonify({'error': 'Faltan datos'}), 400
    fname = secure_filename(img.filename)
    img.save(os.path.join(UPLOAD_FOLDER, fname))
    conn = obtener_conexion()
    conn.execute("INSERT INTO products(titulo, descripcion, seccion, marca, precio, imagen) VALUES (?,?,?,?,?,?)", (t,d,s,m,p,fname))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Éxito'})

# ---------------------------------------------------
# RUTAS DE ARCHIVOS Y PÁGINAS
# ---------------------------------------------------
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
@app.route('/catalogo')
def home(): return send_from_directory('.', 'index.html')

@app.route('/carrito.html')
def cart_page(): return send_from_directory('.', 'carrito.html')

@app.route('/login')
def login_page(): return send_from_directory('.', 'login.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import hashlib

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = os.environ.get('LLAVE_SECRETA', 'supersecretkey')
CORS(app, supports_credentials=True)

# Variables de Railway
OWNER_CODE = os.environ.get('CODIGO_REGISTRO')
WOMPI_SECRET = os.environ.get('WOMPI_INTEGRITY_SECRET')

# Configuración de Volumen Persistente (Fundamental en Railway)
DATA_DIR = "/data"
DB_PATH = os.path.join(DATA_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def obtener_conexion():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# Inicializar tablas si no existen
def init_db():
    conn = obtener_conexion()
    conn.execute("""CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL, descripcion TEXT,
        seccion TEXT, marca TEXT, precio REAL, imagen TEXT)""")
    conn.commit()
    conn.close()

init_db()

# --- RUTAS DE LA API ---

@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto')
    moneda = request.args.get('moneda', 'COP')
    if not WOMPI_SECRET: return jsonify({'error': 'Llave no configurada'}), 500
    monto_limpio = str(int(float(monto)))
    cadena = f"{referencia}{monto_limpio}{moneda}{WOMPI_SECRET.strip()}"
    firma = hashlib.sha256(cadena.encode()).hexdigest()
    return jsonify({'firma': firma})

@app.route('/products', methods=['GET'])
def get_products():
    conn = obtener_conexion()
    res = [dict(row) for row in conn.execute("SELECT * FROM products ORDER BY id DESC").fetchall()]
    conn.close()
    for p in res: p['imagen'] = f"/uploads/{p['imagen']}"
    return jsonify(res)

@app.route('/product', methods=['POST'])
def add_product():
    # Nota: require_owner desactivado temporalmente para pruebas iniciales
    t, d, s, m, p = request.form.get('titulo'), request.form.get('descripcion'), request.form.get('seccion'), request.form.get('marca'), request.form.get('precio')
    img = request.files.get('imagen')
    fname = secure_filename(img.filename)
    img.save(os.path.join(UPLOAD_FOLDER, fname))
    conn = obtener_conexion()
    conn.execute("INSERT INTO products(titulo, descripcion, seccion, marca, precio, imagen) VALUES (?,?,?,?,?,?)", (t,d,s,m,p,fname))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Éxito'})

# --- RUTAS DE ARCHIVOS ---
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
@app.route('/catalogo')
def home(): return send_from_directory('.', 'index.html')

@app.route('/carrito.html')
def cart_page(): return send_from_directory('.', 'carrito.html')

@app.route('/login')
def login(): return send_from_directory('.', 'login.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
