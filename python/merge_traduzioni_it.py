import json
import re

def load_json_from_ts(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            # Match the RESOURCES section more robustly
            match = re.search(r'RESOURCES:\s*\{(.*?)\}\s*,\s*VIEWS:', content, re.DOTALL)
            if match:
                ts_str = match.group(1)
                print(f"Found RESOURCES content: {ts_str[:200]}...")  # Print part of the content for debugging
                json_str = ts_to_json(ts_str)
                print(f"Converted JSON string: {json_str[:200]}...")  # Print part of the JSON string for debugging
                return json.loads(json_str)
            else:
                print(f"Could not find RESOURCES in file {file_path}")
                return {}
    except (json.JSONDecodeError, UnicodeDecodeError, AttributeError) as e:
        print(f"Error loading file {file_path}: {e}")
        return {}

def ts_to_json(ts_content):
    try:
        # Add quotes around keys and convert single quotes to double quotes
        ts_content = re.sub(r'(\w+):', r'"\1":', ts_content)  # Add quotes around keys
        ts_content = re.sub(r'\'', r'"', ts_content)  # Replace single quotes with double quotes
        ts_content = re.sub(r',\s*}', r'}', ts_content)  # Remove trailing commas before closing braces
        ts_content = '{' + ts_content + '}'  # Add enclosing braces
        print(f"TS to JSON content: {ts_content[:200]}...")  # Print part of the content for debugging
        return ts_content
    except Exception as e:
        print(f"Error converting TypeScript to JSON: {e}")
        return '{}'

def save_json_to_ts(file_path, data):
    try:
        with open(file_path, 'r+', encoding='utf-8') as file:
            content = file.read()
            json_str = json.dumps(data, ensure_ascii=False, indent=4)
            # Convert JSON string back to TypeScript object format
            json_str = re.sub(r'"(\w+)"\s*:', r'\1:', json_str)  # Remove quotes from keys for TS format
            json_str = json_str.replace(': "', ": '").replace('",', "',").replace('"}', "'}")
            new_content = re.sub(r'RESOURCES:\s*\{(.*?)\}\s*,\s*VIEWS:', f'RESOURCES: {json_str},\n        VIEWS:', content, flags=re.DOTALL)
            file.seek(0)
            file.write(new_content)
            file.truncate()
    except IOError as e:
        print(f"Error saving file {file_path}: {e}")

def load_new_keys(file_path):
    new_keys = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            for line in file:
                match = re.match(r'(\w+)\s*:\s*"(.*)"\s*,?', line.strip())
                if match:
                    key, value = match.groups()
                    new_keys[key] = value
    except IOError as e:
        print(f"Error loading file {file_path}: {e}")
    return new_keys

def merge_translation_keys(existing_file, new_keys_file):
    # Load the existing TypeScript file and the new keys from the text file
    existing_data = load_json_from_ts(existing_file)
    new_keys = load_new_keys(new_keys_file)

    # Get the existing keys under RESOURCES
    existing_keys = existing_data

    if not existing_keys:
        print(f"No existing keys found in RESOURCES in file {existing_file}")
        return

    # Add new keys if they do not already exist
    for key, value in new_keys.items():
        if key not in existing_keys:
            existing_keys[key] = value

    # Sort the keys alphabetically
    sorted_keys = dict(sorted(existing_keys.items()))

    # Save the existing TypeScript file with the new keys
    save_json_to_ts(existing_file, sorted_keys)

# Example usage
existing_file_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'  # Replace with the path to the existing file
new_keys_file_path = '/home/gcrozzolin/Development/onecompliance/python/file_new_translate.txt'  # Replace with the path to the file with new keys

merge_translation_keys(existing_file_path, new_keys_file_path)
