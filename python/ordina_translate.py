import re

def read_typescript_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.readlines()

def write_typescript_file(file_path, lines):
    with open(file_path, 'w', encoding='utf-8') as file:
        file.writelines(lines)

def extract_keys(content):
    # Assuming the keys are inside an interface or a type declaration
    pattern = re.compile(r'\s*(\w+)\s*:')
    keys = []
    for line in content:
        match = pattern.match(line)
        if match:
            keys.append(match.group(1))
    return keys

def sort_keys(keys):
    return sorted(keys)

def rebuild_content(content, sorted_keys):
    pattern = re.compile(r'\s*(\w+)\s*:')
    sorted_content = []
    for key in sorted_keys:
        for line in content:
            if pattern.match(line) and pattern.match(line).group(1) == key:
                sorted_content.append(line)
                break
    return sorted_content

def main(input_file, output_file):
    content = read_typescript_file(input_file)
    keys = extract_keys(content)
    sorted_keys = sort_keys(keys)
    sorted_content = rebuild_content(content, sorted_keys)
    write_typescript_file(output_file, sorted_content)

if __name__ == "__main__":
    input_file = '/home/apoli/Development/onecompliance/src/app/oc/i18n/it.ts'
    output_file = '/home/apoli/Development/onecompliance/python/chiavi_ordinate.txt'
    main(input_file, output_file)
