import re
import googletrans
from googletrans import Translator

# Funzione per leggere le chiavi da tradurre da un file di testo
def read_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        keys = file.read().splitlines()
    return keys

# Funzione per tradurre le frasi
def translate_phrases(keys):
    translator = Translator()
    translations = {key: translator.translate(key, dest='it').text for key in keys}
    return translations

# Funzione per copiare il contenuto di un file typescript in un altro file testo
def copy_typescript_to_text(ts_file_path, txt_file_path):
    with open(ts_file_path, 'r', encoding='utf-8') as ts_file:
        content = ts_file.read()
    
    with open(txt_file_path, 'w', encoding='utf-8') as txt_file:
        txt_file.write(content)

# Funzione per inserire le traduzioni nel file di testo
def insert_translations(txt_file_path, translations):
    with open(txt_file_path, 'r', encoding='utf-8') as file:
        content = file.read()
    
    translation_entries = [f'"{k}": "{v}"' for k, v in sorted(translations.items())]
    translation_block = ',\n'.join(translation_entries)

    # Trovare la posizione della quarta parentesi graffa
    matches = [match.start() for match in re.finditer(r'\{', content)]
    if len(matches) >= 4:
        fourth_brace_position = matches[3] + 1
        updated_content = content[:fourth_brace_position] + '\n' + translation_block + '\n' + content[fourth_brace_position:]
    else:
        updated_content = content

    with open(txt_file_path, 'w', encoding='utf-8') as file:
        file.write(updated_content)

# Funzione per ricopiare il contenuto del file di testo nel file typescript
def copy_text_to_typescript(txt_file_path, ts_file_path):
    with open(txt_file_path, 'r', encoding='utf-8') as txt_file:
        content = txt_file.read()
    
    with open(ts_file_path, 'w', encoding='utf-8') as ts_file:
        ts_file.write(content)

# Percorsi dei file
keys_file = '/home/alpoli/Developement/onecompliance/python/file_mancanti_en.txt'
source_ts_file = '/home/alpoli/Developement/onecompliance/src/app/oc/i18n/en.ts'
destination_txt_file = '/home/alpoli/Developement/onecompliance/python/en_copy.txt'

# Lettura delle chiavi e traduzione delle frasi
keys = read_keys(keys_file)
translations = translate_phrases(keys)

# Copia del contenuto del file TypeScript in un file di testo
copy_typescript_to_text(source_ts_file, destination_txt_file)

# Inserimento delle traduzioni nel file di testo
insert_translations(destination_txt_file, translations)

# Ricopia del contenuto del file di testo nel file TypeScript
copy_text_to_typescript(destination_txt_file, source_ts_file)

print("Operazione completata con successo.")
