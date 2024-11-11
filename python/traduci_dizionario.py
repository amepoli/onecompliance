from googletrans import Translator
import re
import time
import os
import shutil

# Definisci la variabile globale
lang_trovato = False

def translate_file(it_file_path, en_file_path, notes_file_path, max_retries=6, delay_between_retries=5):
    global lang_trovato  # Indica che useremo la variabile globale

    # Inizializza il traduttore
    translator = Translator()

    # Estrai il nome del file di output senza estensione
    output_filename = os.path.splitext(os.path.basename(en_file_path))[0]

    # Leggi il contenuto del file italiano
    with open(it_file_path, 'r', encoding='utf-8') as it_file:
        it_content = it_file.read()

    # Leggi il contenuto del file di note per memorizzare le chiavi esistenti
    existing_keys = set()
    if os.path.exists(notes_file_path):
        with open(notes_file_path, 'r', encoding='utf-8') as notes_file:
            for line in notes_file:
                match = re.match(r'(\w+):\s*".*"', line)
                if match:
                    existing_keys.add(match.group(1))

    # Apri il file di note in modalità append per non cancellarne il contenuto
    with open(notes_file_path, 'a', encoding='utf-8') as notes_file:
        
        # Funzione per tradurre una stringa con gestione del retry
        def translate(match):
            global lang_trovato  # Indica che useremo la variabile globale

            key = match.group(1).strip()
            value_to_translate = match.group(2).strip()

            # Gestisce la chiave "lang"
            if key == "lang" and not lang_trovato:
                lang_trovato = True  # Imposta la flag a True
                # Ritorna il valore "lang" impostato al nome del file di output senza estensione
                return f'{key}: "{output_filename}"'

            # Se il valore è vuoto, controlla se la chiave è già presente nel file di note
            if not value_to_translate:
                if key not in existing_keys:
                    notes_file.write(f'{key}: ""\n')
                    existing_keys.add(key)
                return f'{key}: ""'

            for attempt in range(max_retries):
                try:
                    # Prova a tradurre il valore
                    translation = translator.translate(value_to_translate, src='it', dest='en').text
                    
                    # Se la traduzione coincide con il valore di input, controlla se la chiave è già presente nel file di note
                    if translation == value_to_translate:
                        if key not in existing_keys:
                            notes_file.write(f'{key}: "{value_to_translate}"\n')
                            existing_keys.add(key)
                    
                    return f'{key}: "{translation}"'
                except Exception as e:
                    if attempt < max_retries - 1:
                        time.sleep(delay_between_retries)
                    else:
                        # Se la traduzione fallisce dopo i tentativi, controlla se la chiave è già presente nel file di note
                        if key not in existing_keys:
                            notes_file.write(f'{key}: "{value_to_translate}"\n')
                            existing_keys.add(key)
                        return f'{key}: "{value_to_translate}"'

        # Regex aggiornata per catturare la chiave e il valore associato senza virgolette per la chiave
        en_content = re.sub(r'(\w+):\s*"([^"]*)"', translate, it_content)

    # Scrivi il contenuto tradotto nel file inglese
    with open(en_file_path, 'w', encoding='utf-8') as en_file:
        en_file.write(en_content)

def update_translations(en_file_path, notes_file_path):
    global temp_file_path  # Utilizza la variabile globale definita all'inizio

    # Copia il contenuto del file di output nel file temporaneo
    shutil.copyfile(en_file_path, temp_file_path)

    # Leggi le traduzioni dal file delle note
    translations = {}
    with open(notes_file_path, 'r', encoding='utf-8') as notes_file:
        lines = notes_file.readlines()
        for line in lines:
            match = re.match(r'(\w+):\s*"(.*)"', line)
            if match:
                key = match.group(1)
                translation = match.group(2)
                translations[key] = translation

    # Leggi il contenuto del file temporaneo
    with open(temp_file_path, 'r', encoding='utf-8') as temp_file:
        temp_content = temp_file.readlines()

    # Sostituisci le traduzioni nel file temporaneo e raccogli le chiavi trovate
    updated_content = []
    found_keys = set()
    for line in temp_content:
        # Regex aggiornata per catturare la chiave, i due punti e gli spazi, il valore e la virgola finale (se presente)
        match = re.match(r'(\s*\w+\s*:\s*)"(.*)"(\s*,?\s*)', line)
        
        if match:
            key_with_format = match.group(1)  # Mantieni la chiave con formattazione
            key = key_with_format.split(':')[0].strip()  # Estrai la chiave senza formattazione
            value_format = match.group(3)  # Mantieni la virgola finale e gli spazi
            
            if key in translations:
                # Sostituisci solo il valore mantenendo la formattazione della chiave e la virgola finale
                updated_content.append(f'{key_with_format}"{translations[key]}"{value_format}'.rstrip())
                found_keys.add(key)  # Aggiungi la chiave trovata
            else:
                updated_content.append(line.rstrip())
        else:
            # Se la riga non corrisponde al formato "chiave: "valore"", lasciala invariata
            updated_content.append(line.rstrip())

    # Rimuovi le chiavi non trovate dal file delle note
    with open(notes_file_path, 'w', encoding='utf-8') as notes_file:
        for key, translation in translations.items():
            if key in found_keys:
                notes_file.write(f'{key}: "{translation}"\n')

    # Scrivi il contenuto aggiornato nel file temporaneo
    with open(temp_file_path, 'w', encoding='utf-8') as temp_file:
        temp_file.write('\n'.join(updated_content) + '\n')

    # Copia il contenuto del file temporaneo nel file di output
    shutil.copyfile(temp_file_path, en_file_path)


# Definizione dei percorsi dei file usando la directory home dell'utente
home_dir = os.path.expanduser('~')
it_file_path = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/it.ts') # Percorso del file it.ts
en_file_path = os.path.join(home_dir, 'Development/onecompliance/src/app/oc/i18n/en.ts') # Percorso del file en.ts
notes_file_path = os.path.join(home_dir, 'Development/onecompliance/python/file_traduzioni_note_en.txt') # Percorso del file delle traduzioni note
temp_file_path = os.path.join(home_dir, 'Development/onecompliance/python/file_new_translate.txt')  # Percorso del file temporaneo

print("Esecuzione lunga: tempo medio d'attesa 8 minuti")
translate_file(it_file_path, en_file_path, notes_file_path)
update_translations(en_file_path, notes_file_path)
