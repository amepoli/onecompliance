import re

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

def write_sorted_keys_to_file(input_path, output_path):
    keys_phrases = get_keys_and_phrases_from_file(input_path)
    sorted_keys = sorted(keys_phrases.keys(), key=lambda x: x.lower())
    
    with open(output_path, 'w', encoding='utf-8') as output_file:
        for key in sorted_keys:
            phrase = keys_phrases[key]
            output_file.write(f'{key}: "{phrase}",\n')

# Usage
input_path = '/home/alpoli/Developement/onecompliance/python/elementi_tradotti.txt'
output_path = '/home/alpoli/Developement/onecompliance/python/chiavi_ordinate.txt'

write_sorted_keys_to_file(input_path, output_path)
