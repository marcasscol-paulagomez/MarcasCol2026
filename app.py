from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import sqlite3
import os
import hashlib  # Añadido para la firma de Wompi

# ---------------------------------------------------
# CONFIGURACIÓN BASE
# ---------------------------------------------------
app = Flask(__name__, static_folder='.', static_url_path='')

app.secret_key = os.environ.get('LLAVE_SECRETA', 'supersecretkey')
CORS(app, supports_credentials=True)

OWNER_CODE = os.environ.get('CODIGO_REGISTRO')
# Llave de Wompi desde las variables de Railway
WOMPI_SECRET = os.environ.get('WOMPI_INTEGRITY_SECRET')

DATA_DIR = "/data"
DB_PATH = os.path.join(DATA_DIR, "database.db")
UPLOAD_FOLDER = os.path.join(DATA_DIR, "uploads")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ---------------------------------------------------
# UTILIDADES DE SEGURIDAD (WOMPI)
# ---------------------------------------------------
def generar_firma_wompi(referencia, monto_en_centavos, moneda):
    """
    Genera la firma de integridad requerida por Wompi para asegurar los pagos.
    """
    if not WOMPI_SECRET:
        return None
    # La cadena debe ser: referencia + monto_en_centavos + moneda + secreto
    cadena = f"{referencia}{monto_en_centavos}{moneda}{WOMPI_SECRET}"
    return hashlib.sha256(cadena.encode()).hexdigest()

@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto') # Debe llegar en centavos (ej: 5000000)
    moneda = request.args.get('moneda', 'COP')

    if not referencia or not monto:
        return jsonify({'error': 'Faltan parámetros'}), 400

    firma = generar_firma_wompi(referencia, monto, moneda)
    
    if not firma:
        return jsonify({'error': 'Servidor no configurado con WOMPI_INTEGRITY_SECRET'}), 500

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
        titulo TEXT NOT NULL,
        descripcion TEXT NOT NULL,
        seccion TEXT NOT NULL,
        marca TEXT NOT NULL,
        precio REAL NOT NULL,
        imagen TEXT NOT NULL
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS secciones(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT UNIQUE NOT NULL
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS slides(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT NOT NULL,
        descripcion TEXT,
        marca TEXT,
        imagen TEXT NOT NULL,
        boton_texto TEXT,
        boton_url TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS marcas(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        imagen TEXT
    )""")

    c.execute("""
    CREATE TABLE IF NOT EXISTS mensajes(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        texto TEXT NOT NULL,
        activo INTEGER DEFAULT 1,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )""")

    conn.commit()
    conn.close()


# Copiar base del repo si no existe
if not os.path.exists(DB_PATH):
    if os.path.exists("database.db"):
        import shutil
        shutil.copy("database.db", DB_PATH)

create_tables()


# ---------------------------------------------------
# OWNER LOGIN (ÚNICO ACCESO)
# ---------------------------------------------------
@app.route('/owner-login', methods=['POST'])
def owner_login():
    code = (request.get_json() or {}).get('code')

    if not OWNER_CODE:
        return jsonify({'error': 'Servidor sin CODIGO_REGISTRO'}), 500

    if code == OWNER_CODE:
        session['owner'] = True
        return jsonify({'message': 'Acceso concedido'})

    return jsonify({'error': 'Código incorrecto'}), 401


@app.route('/owner-logout', methods=['POST'])
def owner_logout():
    session.clear()
    return jsonify({'message': 'Sesión cerrada'})


def require_owner():
    if not session.get('owner'):
        return jsonify({'error': 'No autenticado'}), 401
    return None


# ---------------------------------------------------
# SECCIONES
# ---------------------------------------------------
@app.route('/secciones', methods=['GET', 'POST'])
def secciones():
    conn = obtener_conexion()
    cur = conn.cursor()

    if request.method == 'POST':
        not_owner = require_owner()
        if not_owner: return not_owner

        nombre = request.json.get('nombre')
        if not nombre:
            return jsonify({'error': 'Falta nombre'}), 400

        try:
            cur.execute("INSERT INTO secciones(nombre) VALUES (?)", (nombre,))
            conn.commit()
        except sqlite3.IntegrityError:
            return jsonify({'error': 'Ya existe'}), 400

        conn.close()
        return jsonify({'message': 'Sección agregada'})

    cur.execute("SELECT nombre FROM secciones ORDER BY id")
    result = [row['nombre'] for row in cur.fetchall()]
    conn.close()
    return jsonify(result)


# ---------------------------------------------------
# SLIDES
# ---------------------------------------------------
@app.route('/slides', methods=['GET', 'POST'])
def slides():
    conn = obtener_conexion()
    cur = conn.cursor()

    if request.method == 'POST':
        not_owner = require_owner()
        if not_owner: return not_owner

        if request.content_type.startswith('multipart/form-data'):
            titulo = request.form.get('titulo')
            descripcion = request.form.get('descripcion')
            marca = request.form.get('marca')
            boton_texto = request.form.get('boton_texto')
            boton_url = request.form.get('boton_url')
            imagen_file = request.files.get('imagen')

            if not titulo or not imagen_file:
                return jsonify({'error': 'Faltan datos'}), 400

            filename = secure_filename(imagen_file.filename)
            imagen_file.save(os.path.join(UPLOAD_FOLDER, filename))
            imagen = filename
        else:
            data = request.json
            titulo = data.get('titulo')
            descripcion = data.get('descripcion')
            marca = data.get('marca')
            imagen = data.get('imagen')
            boton_texto = data.get('boton_texto')
            boton_url = data.get('boton_url')

        cur.execute("""
            INSERT INTO slides(titulo, descripcion, marca, imagen, boton_texto, boton_url)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (titulo, descripcion, marca, imagen, boton_texto, boton_url))

        conn.commit()
        conn.close()
        return jsonify({'message':'Banner agregado'})

    cur.execute("SELECT * FROM slides ORDER BY id DESC")
    result = [dict(row) for row in cur.fetchall()]
    conn.close()

    for s in result:
        if not str(s['imagen']).startswith("http"):
            s['imagen'] = f"/uploads/{s['imagen']}"

    return jsonify(result)


@app.route('/slides/<int:id>', methods=['DELETE'])
def delete_slide(id):
    not_owner = require_owner()
    if not_owner: return not_owner

    conn = obtener_conexion()
    cur = conn.cursor()

    cur.execute("SELECT imagen FROM slides WHERE id = ?", (id,))
    row = cur.fetchone()

    if not row:
        return jsonify({'error': 'No encontrado'}), 404

    imagen = row['imagen']

    cur.execute("DELETE FROM slides WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    path = os.path.join(UPLOAD_FOLDER, imagen)
    if os.path.exists(path):
        os.remove(path)

    return jsonify({'message':'Banner eliminado'})


# ---------------------------------------------------
# MARCAS
# ---------------------------------------------------
@app.route('/marcas', methods=['GET', 'POST'])
def marcas():
    conn = obtener_conexion()
    cur = conn.cursor()

    if request.method == 'POST':
        not_owner = require_owner()
        if not_owner: return not_owner

        nombre = None
        imagen = None

        if request.content_type.startswith('multipart/form-data'):
            nombre = request.form.get('nombre')
            imagen_file = request.files.get('imagen')
            if imagen_file:
                filename = secure_filename(imagen_file.filename)
                imagen_file.save(os.path.join(UPLOAD_FOLDER, filename))
                imagen = filename
        else:
            data = request.json
            nombre = data.get('nombre')
            imagen = data.get('imagen')

        if not nombre:
            return jsonify({'error':'Falta nombre'}), 400

        cur.execute("INSERT INTO marcas(nombre, imagen) VALUES (?, ?)", (nombre, imagen))
        conn.commit()
        conn.close()

        return jsonify({'message':'Marca agregada'})

    cur.execute("SELECT * FROM marcas ORDER BY id")
    result = [dict(row) for row in cur.fetchall()]
    conn.close()

    for m in result:
        if m['imagen'] and not str(m['imagen']).startswith("http"):
            m['imagen'] = f"/uploads/{m['imagen']}"

    return jsonify(result)


# ---------------------------------------------------
# PRODUCTOS
# ---------------------------------------------------
@app.route('/product', methods=['POST'])
def add_product():
    not_owner = require_owner()
    if not_owner: return not_owner

    titulo = request.form.get('titulo')
    descripcion = request.form.get('descripcion')
    seccion = request.form.get('seccion')
    marca = request.form.get('marca')
    precio = request.form.get('precio')
    imagen = request.files.get('imagen')

    if not (titulo and descripcion and seccion and marca and precio and imagen):
        return jsonify({'error': 'Faltan datos'}), 400

    filename = secure_filename(imagen.filename)
    imagen.save(os.path.join(UPLOAD_FOLDER, filename))

    conn = obtener_conexion()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO products(titulo, descripcion, seccion, marca, precio, imagen)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (titulo, descripcion, seccion, marca, precio, filename))

    conn.commit()
    conn.close()

    return jsonify({'message':'Producto agregado'})


@app.route('/product/<int:id>', methods=['DELETE'])
def delete_product(id):
    not_owner = require_owner()
    if not_owner: return not_owner

    conn = obtener_conexion()
    cur = conn.cursor()

    cur.execute("SELECT imagen FROM products WHERE id = ?", (id,))
    row = cur.fetchone()

    if not row:
        return jsonify({'error':'Producto no encontrado'}), 404

    imagen = row['imagen']

    cur.execute("DELETE FROM products WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    img_path = os.path.join(UPLOAD_FOLDER, imagen)
    if os.path.exists(img_path):
        os.remove(img_path)

    return jsonify({'message':'Producto eliminado'})


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


# ---------------------------------------------------
# MENSAJES
# ---------------------------------------------------
@app.route('/mensajes', methods=['GET', 'POST'])
def mensajes():
    conn = obtener_conexion()
    cur = conn.cursor()

    if request.method == 'POST':
        not_owner = require_owner()
        if not_owner: return not_owner

        data = request.json
        texto = data.get('texto')

        if not texto:
            return jsonify({'error':'Falta texto'}), 400

        cur.execute("INSERT INTO mensajes(texto) VALUES (?)", (texto,))
        conn.commit()
        conn.close()
        return jsonify({'message':'Mensaje agregado'})

    cur.execute("SELECT * FROM mensajes ORDER BY creado_en DESC")
    result = [dict(row) for row in cur.fetchall()]
    conn.close()

    return jsonify(result)


# ---------------------------------------------------
# CATALOGO
# ---------------------------------------------------
@app.route('/mensaje/ultimo', methods=['GET'])
def mensaje_ultimo():
    conn = obtener_conexion()
    cur = conn.cursor()
    cur.execute("SELECT texto FROM mensajes WHERE activo=1 ORDER BY creado_en DESC LIMIT 1")
    row = cur.fetchone()
    conn.close()

    return jsonify({'mensaje': row['texto'] if row else None})


@app.route('/marcas/<path:marca>/secciones', methods=['GET'])
def marca_secciones(marca):
    conn = obtener_conexion()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT seccion FROM products WHERE marca=? ORDER BY seccion", (marca,))
    result = [row['seccion'] for row in cur.fetchall()]
    conn.close()
    return jsonify(result)


@app.route('/products/filter', methods=['GET'])
def products_filter():
    marca = request.args.get('marca')
    seccion = request.args.get('seccion')

    conn = obtener_conexion()
    cur = conn.cursor()

    query = "SELECT * FROM products"
    where = []
    params = []

    if marca:
        where.append("marca = ?")
        params.append(marca)

    if seccion:
        where.append("seccion = ?")
        params.append(seccion)

    if where:
        query += " WHERE " + " AND ".join(where)

    query += " ORDER BY id DESC"

    cur.execute(query, params)
    result = [dict(row) for row in cur.fetchall()]
    conn.close()

    for p in result:
        p['imagen'] = f"/uploads/{p['imagen']}"

    return jsonify(result)


# ---------------------------------------------------
# ARCHIVOS SUBIDOS
# ---------------------------------------------------
@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


# ---------------------------------------------------
# PÁGINAS ESTÁTICAS
# ---------------------------------------------------
@app.route('/')
def home():
    return send_from_directory('.', 'index.html')

@app.route('/catalogo')
def catalogo():
    return send_from_directory('.', 'index.html')

@app.route('/login')
def login():
    return send_from_directory('.', 'login.html')


# ---------------------------------------------------
# RUN
# ---------------------------------------------------
if __name__ == '__main__':
    app.run(debug=True)
