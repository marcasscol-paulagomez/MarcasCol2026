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

# Rutas para Railway (Volumen persistente)
DATA_DIR = "/data"
DB_PATH = os.path.join(DATA_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(DATA_DIR, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def obtener_conexion():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# ---------------------------------------------------
# FIRMA DE SEGURIDAD WOMPI
# ---------------------------------------------------
@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto')
    moneda = request.args.get('moneda', 'COP')
    
    if not WOMPI_SECRET:
        return jsonify({'error': 'WOMPI_INTEGRITY_SECRET no configurada'}), 500
    
    # Limpieza: Wompi requiere monto en centavos como entero
    monto_limpio = str(int(float(monto)))
    cadena = f"{referencia}{monto_limpio}{moneda}{WOMPI_SECRET.strip()}"
    firma = hashlib.sha256(cadena.encode()).hexdigest()
    
    return jsonify({'firma': firma})

# ---------------------------------------------------
# PRODUCTOS Y CATÁLOGO
# ---------------------------------------------------
@app.route('/products', methods=['GET'])
def get_products():
    try:
        conn = obtener_conexion()
        productos = [dict(row) for row in conn.execute("SELECT * FROM products ORDER BY id DESC").fetchall()]
        conn.close()
        for p in productos:
            p['imagen'] = f"/uploads/{p['imagen']}"
        return jsonify(productos)
    except:
        return jsonify([])

@app.route('/product', methods=['POST'])
def add_product():
    if not session.get('owner'): return jsonify({'error': 'No autorizado'}), 401
    t, d, s, m, p = request.form.get('titulo'), request.form.get('descripcion'), request.form.get('seccion'), request.form.get('marca'), request.form.get('precio')
    img = request.files.get('imagen')
    fname = secure_filename(img.filename)
    img.save(os.path.join(UPLOAD_FOLDER, fname))
    conn = obtener_conexion()
    conn.execute("INSERT INTO products(titulo, descripcion, seccion, marca, precio, imagen) VALUES (?,?,?,?,?,?)", (t,d,s,m,p,fname))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Éxito'})

# ---------------------------------------------------
# RUTAS DE PÁGINAS
# ---------------------------------------------------
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/')
@app.route('/catalogo')
def home(): return send_from_directory('.', 'index.html')

@app.route('/login')
def login_page(): return send_from_directory('.', 'login.html')

@app.route('/owner-login', methods=['POST'])
def owner_login():
    code = (request.get_json() or {}).get('code')
    if code == OWNER_CODE:
        session['owner'] = True
        return jsonify({'message': 'Ok'})
    return jsonify({'error': 'Error'}), 401

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
