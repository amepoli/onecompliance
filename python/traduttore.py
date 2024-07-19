import re
from googletrans import Translator

def translate_phrases_in_file(input_path, output_path, source_lang='it', target_lang='en'):
    translator = Translator()
    with open(input_path, 'r', encoding='utf-8') as input_file, open(output_path, 'w', encoding='utf-8') as output_file:
        for line in input_file:
            matches = re.findall(r'\"(.*?)\"', line)
            translated_line = line
            for match in matches:
                translated_text = translator.translate(match, src=source_lang, dest=target_lang).text
                translated_line = translated_line.replace(f'"{match}"', f'"{translated_text}"')
            output_file.write(translated_line)

# Usage
input_path = '/home/alpoli/Developement/onecompliance/python/file_mancanti_en.txt'
output_path = '/home/alpoli/Developement/onecompliance/python/elementi_tradotti.txt'

translate_phrases_in_file(input_path, output_path)
