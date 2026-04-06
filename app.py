from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import hashlib  # Verificado: Indispensable para Wompi

# ---------------------------------------------------
# CONFIGURACIÓN BASE
# ---------------------------------------------------
app = Flask(__name__, static_folder='.', static_url_path='')

app.secret_key = os.environ.get('LLAVE_SECRETA', 'supersecretkey')
CORS(app, supports_credentials=True)

# Variables de entorno en Railway
OWNER_CODE = os.environ.get('CODIGO_REGISTRO')
WOMPI_SECRET = os.environ.get('WOMPI_INTEGRITY_SECRET')

DATA_DIR = "/data"
DB_PATH = os.path.join(DATA_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(DATA_DIR, "uploads")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------------------------------------------
# MOTOR DE FIRMAS WOMPI (VERIFICADO)
# ---------------------------------------------------
def generar_firma_wompi(referencia, monto_en_centavos, moneda):
    """
    Crea el hash SHA256 que Wompi exige para validar la integridad.
    """
    if not WOMPI_SECRET:
        return None
    # El orden es estricto: referencia + monto + moneda + secreto
    cadena = f"{referencia}{monto_en_centavos}{moneda}{WOMPI_SECRET}"
    return hashlib.sha256(cadena.encode()).hexdigest()

@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto') 
    moneda = request.args.get('moneda', 'COP')

    if not referencia or not monto:
        return jsonify({'error': 'Referencia y monto son obligatorios'}), 400

    firma = generar_firma_wompi(referencia, monto, moneda)
    
    if not firma:
        return jsonify({'error': 'Configuración incompleta: Falta WOMPI_INTEGRITY_SECRET en Railway'}), 500

    return jsonify({'firma': firma})


# ---------------------------------------------------
# GESTIÓN DE BASE DE DATOS
# ---------------------------------------------------
def obtener_conexion():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def create_tables():
    conn = obtener_conexion()
    c = conn.cursor()
    c.execute("""CREATE TABLE IF NOT EXISTS products(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL, descripcion TEXT NOT NULL,
        seccion TEXT NOT NULL, marca TEXT NOT NULL,
        precio REAL NOT NULL, imagen TEXT NOT NULL
    )""")
    c.execute("CREATE TABLE IF NOT EXISTS secciones(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE NOT NULL)")
    c.execute("""CREATE TABLE IF NOT EXISTS slides(
        id INTEGER PRIMARY KEY AUTOINCREMENT, titulo TEXT NOT NULL,
        descripcion TEXT, marca TEXT, imagen TEXT NOT NULL,
        boton_texto TEXT, boton_url TEXT
    )""")
    c.execute("CREATE TABLE IF NOT EXISTS marcas(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, imagen TEXT)")
    c.execute("""CREATE TABLE IF NOT EXISTS mensajes(
        id INTEGER PRIMARY KEY AUTOINCREMENT, texto TEXT NOT NULL,
        activo INTEGER DEFAULT 1, creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")
    conn.commit()
    conn.close()

if not os.path.exists(DB_PATH) and os.path.exists("database.db"):
    import shutil
    shutil.copy("database.db", DB_PATH)

create_tables()

# ---------------------------------------------------
# LOGIN ADMINISTRADOR
# ---------------------------------------------------
@app.route('/owner-login', methods=['POST'])
def owner_login():
    code = (request.get_json() or {}).get('code')
    if not OWNER_CODE: return jsonify({'error': 'Servidor sin clave configurada'}), 500
    if code == OWNER_CODE:
        session['owner'] = True
        return jsonify({'message': 'Acceso concedido'})
    return jsonify({'error': 'Código incorrecto'}), 401

@app.route('/owner-logout', methods=['POST'])
def owner_logout():
    session.clear()
    return jsonify({'message': 'Sesión cerrada'})

def require_owner():
    if not session.get('owner'): return jsonify({'error': 'No autorizado'}), 401
    return None

# ---------------------------------------------------
# RUTAS DE PRODUCTOS
# ---------------------------------------------------
@app.route('/product', methods=['POST'])
def add_product():
    check = require_owner()
    if check: return check
    
    t, d, s, m, p = request.form.get('titulo'), request.form.get('descripcion'), \
                   request.form.get('seccion'), request.form.get('marca'), request.form.get('precio')
    img = request.files.get('imagen')

    if not (t and d and s and m and p and img): return jsonify({'error': 'Faltan datos'}), 400

    fname = secure_filename(img.filename)
    img.save(os.path.join(UPLOAD_FOLDER, fname))

    conn = obtener_conexion()
    conn.execute("INSERT INTO products(titulo, descripcion, seccion, marca, precio, imagen) VALUES (?,?,?,?,?,?)",
                 (t, d, s, m, p, fname))
    conn.commit()
    conn.close()
    return jsonify({'message':'Producto agregado'})

@app.route('/products', methods=['GET'])
def get_products():
    conn = obtener_conexion()
    res = [dict(row) for row in conn.execute("SELECT * FROM products ORDER BY id DESC").fetchall()]
    conn.close()
    for p in res: p['imagen'] = f"/uploads/{p['imagen']}"
    return jsonify(res)

@app.route('/product/<int:id>', methods=['DELETE'])
def delete_product(id):
    check = require_owner()
    if check: return check
    conn = obtener_conexion()
    row = conn.execute("SELECT imagen FROM products WHERE id = ?", (id,)).fetchone()
    if row:
        conn.execute("DELETE FROM products WHERE id = ?", (id,))
        conn.commit()
        path = os.path.join(UPLOAD_FOLDER, row['imagen'])
        if os.path.exists(path): os.remove(path)
    conn.close()
    return jsonify({'message':'Eliminado'})

# ---------------------------------------------------
# OTRAS GESTIONES (MARCAS, BANNERS, MENSAJES)
# ---------------------------------------------------
@app.route('/marcas', methods=['GET', 'POST'])
def marcas():
    conn = obtener_conexion()
    if request.method == 'POST':
        check = require_owner()
        if check: return check
        n = request.form.get('nombre') if request.content_type.startswith('multipart/form-data') else request.json.get('nombre')
        img_file = request.files.get('imagen') if request.files else None
        img_name = None
        if img_file:
            img_name = secure_filename(img_file.filename)
            img_file.save(os.path.join(UPLOAD_FOLDER, img_name))
        conn.execute("INSERT INTO marcas(nombre, imagen) VALUES (?,?)", (n, img_name))
        conn.commit()
        conn.close()
        return jsonify({'message':'Marca agregada'})
    res = [dict(row) for row in conn.execute("SELECT * FROM marcas ORDER BY id").fetchall()]
    conn.close()
    for m in res:
        if m['imagen']: m['imagen'] = f"/uploads/{m['imagen']}"
    return jsonify(res)

@app.route('/slides', methods=['GET', 'POST'])
def slides():
    conn = obtener_conexion()
    if request.method == 'POST':
        check = require_owner()
        if check: return check
        t, img = request.form.get('titulo'), request.files.get('imagen')
        if not t or not img: return jsonify({'error':'Datos incompletos'}), 400
        fname = secure_filename(img.filename)
        img.save(os.path.join(UPLOAD_FOLDER, fname))
        conn.execute("INSERT INTO slides(titulo, descripcion, marca, imagen, boton_texto, boton_url) VALUES (?,?,?,?,?,?)",
                     (t, request.form.get('descripcion'), request.form.get('marca'), fname, request.form.get('boton_texto'), request.form.get('boton_url')))
        conn.commit()
        conn.close()
        return jsonify({'message':'Banner guardado'})
    res = [dict(row) for row in conn.execute("SELECT * FROM slides ORDER BY id DESC").fetchall()]
    conn.close()
    for s in res: s['imagen'] = f"/uploads/{s['imagen']}"
    return jsonify(res)

@app.route('/mensaje/ultimo', methods=['GET'])
def mensaje_ultimo():
    conn = obtener_conexion()
    row = conn.execute("SELECT texto FROM mensajes WHERE activo=1 ORDER BY creado_en DESC LIMIT 1").fetchone()
    conn.close()
    return jsonify({'mensaje': row['texto'] if row else None})

# ---------------------------------------------------
# SERVIDORES DE ARCHIVOS Y PÁGINAS
# ---------------------------------------------------
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

if __name__ == '__main__':
    # Configuración de puerto dinámica para Railway
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
