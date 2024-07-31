import re
import shutil
from googletrans import Translator

def copy_ts_to_txt(ts_file_path, txt_file_path):
    shutil.copyfile(ts_file_path, txt_file_path)

def get_keys_and_phrases_from_file(file_path):
    keys_phrases = {}
    with open(file_path, 'r', encoding='utf-8') as file:
        for line in file:
            match = re.match(r'(\w+):\s*"([^"]*)"', line.strip())
            if match:
                key = match.group(1).strip()
                phrase = match.group(2).strip()
                keys_phrases[key] = phrase
    return keys_phrases

def translate_phrase(phrase, translator):
    try:
        translated = translator.translate(phrase, src='it', dest='en')
        return translated.text
    except Exception as e:
        print(f"Translation error for '{phrase}': {e}")
        return phrase

def write_difference_to_files(file1_path, file2_path, output_translated_path, output_not_translated_path):
    keys_phrases_file1 = get_keys_and_phrases_from_file(file1_path)
    keys_phrases_file2 = get_keys_and_phrases_from_file(file2_path)

    difference_keys = keys_phrases_file1.keys() - keys_phrases_file2.keys()
    
    translator = Translator()
    translated_count = 0
    not_translated_count = 0

    with open(output_translated_path, 'w', encoding='utf-8') as translated_file, \
         open(output_not_translated_path, 'w', encoding='utf-8') as not_translated_file:
        for key in sorted(difference_keys):
            original_phrase = keys_phrases_file1[key]
            translated_phrase = translate_phrase(original_phrase, translator)
            if translated_phrase == original_phrase:
                not_translated_count += 1
                not_translated_file.write(f'{key}: "{translated_phrase}",\n')
                translated_file.write(f'{key}: "{translated_phrase}",\n')
            else:
                translated_count += 1
                translated_file.write(f'{key}: "{translated_phrase}",\n')

    # Stampa il numero di chiavi aggiunte e tradotte
    total_added_keys = len(difference_keys)
    print(f"Total keys added: {total_added_keys}")
    print(f"Total keys translated: {translated_count}")
    print(f"Total keys not translated: {not_translated_count}")

# Copia il contenuto dei file TypeScript nei file di testo
copy_ts_to_txt('/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts', '/home/gcrozzolin/Development/onecompliance/python/file_it.txt')
copy_ts_to_txt('/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/en.ts', '/home/gcrozzolin/Development/onecompliance/python/file_en.txt')

# Percorsi dei file di testo
file1_path = '/home/gcrozzolin/Development/onecompliance/python/file_it.txt'
file2_path = '/home/gcrozzolin/Development/onecompliance/python/file_en.txt'
output_translated_path = '/home/gcrozzolin/Development/onecompliance/python/elementi_mancanti_en.txt'
output_not_translated_path = '/home/gcrozzolin/Development/onecompliance/python/file_not_translated.txt'

# Scrive nel file di output le chiavi mancanti
write_difference_to_files(file1_path, file2_path, output_translated_path, output_not_translated_path)
