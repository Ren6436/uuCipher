from flask import Blueprint, request, Response
from substitution_cipher import *
from utiles import *
from flask import jsonify

routes = Blueprint('routes', __name__)

@routes.route('/api/break', methods=['POST'])
def break_route():
    text = request.form.get('text', '')
    uploaded_file = request.files.get('file')

    if uploaded_file:
        ciphered_text = uploaded_file.read().decode('utf-8')
    else:
        ciphered_text = text

    cleaned_text = clean_text(ciphered_text)

    with open("krakatit_cleaned.txt", "r", encoding="utf-8") as f:
        krakatit_text = f.read()

    TM_ref = transition_matrix(get_bigrams(krakatit_text))

    try:
        _, cracked_text, _ = prolom_substitute(cleaned_text, TM_ref, iter=50000)
        print(cracked_text)
        return Response(cracked_text, mimetype='text/plain')
    except Exception as e:
        return Response(f"Error: {str(e)}", mimetype='text/plain', status=500)

@routes.route('/api/encrypt', methods=['POST'])
def encrypt_route():
    text = request.form.get('text', '')
    uploaded_file = request.files.get('file')

    if uploaded_file:
        ciphered_text = uploaded_file.read().decode('utf-8')
    else:
        ciphered_text = text

    cleaned_text = clean_text(ciphered_text)
    try:
        ciphered, key = substitute_encrypt(cleaned_text)
        print(ciphered)
        return jsonify({
            'cipherText': ciphered,
            'key': key
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@routes.route('/api/decrypt', methods=['POST'])
def decrypt_route():
    text = request.form.get('text', '')
    key = request.form.get('key', '')
    uploaded_file = request.files.get('file')

    if uploaded_file:
        ciphered_text = uploaded_file.read().decode('utf-8')
    else:
        ciphered_text = text

    cleaned_text = clean_text(ciphered_text)
    try:
        plaintext = substitute_decrypt(cleaned_text, key)
        print(plaintext)
        return Response(plaintext, mimetype='text/plain',)
    except Exception as e:
        return Response(f"Error: {str(e)}", mimetype='text/plain', status=500)





