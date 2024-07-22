import re
import time
from googletrans import Translator, LANGUAGES

def translate_phrases_in_file(input_path, output_path, source_lang='it', target_lang='en'):
    translator = Translator()
    with open(input_path, 'r', encoding='utf-8') as input_file, open(output_path, 'w', encoding='utf-8') as output_file:
        for line in input_file:
            matches = re.findall(r'\"(.*?)\"', line)
            translated_line = line
            for match in matches:
                translated_text = match  # Default to the original text in case of failure
                try:
                    translation = translator.translate(match, src=source_lang, dest=target_lang)
                    if translation and translation.text:
                        translated_text = translation.text
                except Exception as e:
                    print(f"Error translating '{match}': {e}")
                    time.sleep(1)  # Wait a bit before retrying to avoid rapid repeated failures
                translated_line = translated_line.replace(f'"{match}"', f'"{translated_text}"')
            output_file.write(translated_line)

# Usage
input_path = '/home/alpoli/Developement/onecompliance/python/file_mancanti_en.txt'
output_path = '/home/alpoli/Developement/onecompliance/python/elementi_tradotti.txt'

translate_phrases_in_file(input_path, output_path)
