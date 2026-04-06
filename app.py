# --- REEMPLAZA ESTA SECCIÓN EN TU APP.PY ---

def generar_firma_wompi(referencia, monto, moneda):
    """
    Crea el hash SHA256 exacto. 
    Limpia espacios y asegura formato entero para evitar errores de validación.
    """
    if not WOMPI_SECRET:
        return None
    
    # Limpieza absoluta de datos
    secret_limpio = WOMPI_SECRET.strip()
    ref_limpia = str(referencia).strip()
    # Convertimos a float y luego a int para asegurar que '8500000.0' pase a '8500000'
    monto_limpio = str(int(float(monto)))
    moneda_limpia = str(moneda).strip().upper() # Siempre COP en mayúsculas

    # Cadena estricta de Wompi: referencia + monto + moneda + secreto
    cadena = f"{ref_limpia}{monto_limpio}{moneda_limpia}{secret_limpio}"
    
    return hashlib.sha256(cadena.encode()).hexdigest()

@app.route('/obtener-firma-wompi', methods=['GET'])
def api_get_wompi_signature():
    referencia = request.args.get('referencia')
    monto = request.args.get('monto') 
    moneda = request.args.get('moneda', 'COP')

    if not referencia or not monto:
        return jsonify({'error': 'Faltan parámetros'}), 400

    firma = generar_firma_wompi(referencia, monto, moneda)
    
    if not firma:
        return jsonify({'error': 'WOMPI_INTEGRITY_SECRET no configurada'}), 500

    return jsonify({'firma': firma})
