import re
import shutil

def copy_ts_to_txt(ts_file_path, txt_file_path):
    shutil.copyfile(ts_file_path, txt_file_path)

def is_translation_opportune(key, translation):
    # Rimuovi il suffisso "_sc" se presente
    if key.endswith('_sc'):
        key = key[:-3]
        # Verifica la presenza di caratteri speciali nella traduzione
        if re.search(r'[^a-zA-Z0-9\s]', translation):
            return True
    
    # Rimuovi underscore iniziale e finale
    key = key.strip('_')
    
    # Rimuovi underscore e separa le parole, rendendo maiuscoli i capilettera
    formatted_key = ' '.join(word.capitalize() for word in key.split('_'))
    
    return formatted_key == translation

def filter_translations(ts_file_path, output_txt_path):
    # Copia il contenuto del file .ts nel file .txt
    copy_ts_to_txt(ts_file_path, output_txt_path)
    
    # Leggi il contenuto del file .txt copiato
    with open(output_txt_path, 'r', encoding='utf-8') as file:
        lines = file.readlines()
    
    # Analizza le chiavi e mantieni solo quelle senza una traduzione opportuna
    filtered_lines = []
    for line in lines:
        match = re.match(r'(\w+):\s*"([^"]*)",?', line.strip())
        if match:
            key = match.group(1).strip()
            translation = match.group(2).strip()
            if not is_translation_opportune(key, translation):
                filtered_lines.append(line)
    
    # Scrivi le linee filtrate nel file di output
    with open(output_txt_path, 'w', encoding='utf-8') as file:
        file.writelines(filtered_lines)
    
    # Stampa il numero di chiavi discrepanti
    print(f"Total discrepant keys: {len(filtered_lines)}")

# Esempio di utilizzo
ts_file_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'  # Sostituisci con il percorso del file .ts
output_txt_path = '/home/gcrozzolin/Development/onecompliance/python/file_discrepanze.txt'  # Sostituisci con il percorso del file di output .txt

filter_translations(ts_file_path, output_txt_path)
