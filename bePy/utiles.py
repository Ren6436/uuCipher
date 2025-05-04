import unicodedata
import re

def clean_text(text):
    text = unicodedata.normalize('NFKD', text)
    text = text.lower()
    re.sub(r'[^a-z\s_]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    text = text.replace(' ', '_')
    return text.upper()
