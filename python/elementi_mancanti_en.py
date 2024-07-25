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

def write_difference_to_file(file1_path, file2_path, output_path):
    keys_phrases_file1 = get_keys_and_phrases_from_file(file1_path)
    keys_phrases_file2 = get_keys_and_phrases_from_file(file2_path)

    difference_keys = keys_phrases_file1.keys() - keys_phrases_file2.keys()

    with open(output_path, 'w', encoding='utf-8') as output_file:
        for key in sorted(difference_keys):
            output_file.write(f'{key}: "{keys_phrases_file1[key]}"\n')

# Usage
file1_path = '/home/alpoli/Developement/onecompliance/python/file_it.txt'
file2_path = '/home/alpoli/Developement/onecompliance/python/file_eng.txt'
output_path = '/home/alpoli/Developement/onecompliance/python/file_mancanti_en.txt'

write_difference_to_file(file1_path, file2_path, output_path)
