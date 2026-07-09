def clean_text(text):
    text = text.lower()
    text = text.strip()

    replacements = {
        "á": "a",
        "é": "e",
        "í": "i",
        "ó": "o",
        "ú": "u",
        "¿": "",
        "?": "",
        "¡": "",
        "!": "",
        ".": "",
        ",": ""
    }

    for old, new in replacements.items():
        text = text.replace(old, new)

    return text