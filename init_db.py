import sqlite3

conn = sqlite3.connect('database.db')
c = conn.cursor()



# --------------------------
# Tabla de productos
# --------------------------
c.execute('''
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    seccion TEXT NOT NULL,
    marca TEXT NOT NULL,
    precio REAL NOT NULL,
    imagen TEXT NOT NULL
)
''')

# --------------------------
# Tabla de secciones dinámicas
# --------------------------
c.execute('''
CREATE TABLE IF NOT EXISTS secciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
)
''')

# --------------------------
# Tabla de slides dinámicos
# --------------------------
c.execute('''
CREATE TABLE IF NOT EXISTS slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    marca TEXT,
    imagen TEXT NOT NULL,
    boton_texto TEXT,
    boton_url TEXT
)
''')

# --------------------------
# Tabla de marcas dinámicas
# --------------------------
c.execute('''
CREATE TABLE IF NOT EXISTS marcas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    imagen TEXT
)
''')

# --------------------------
# Tabla de mensajes dinámicos
# --------------------------
c.execute('''
CREATE TABLE IF NOT EXISTS mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT NOT NULL,
    activo INTEGER DEFAULT 1,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
''')

conn.commit()
conn.close()
print('Base de datos y tablas creadas.')
