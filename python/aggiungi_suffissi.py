import os
import json
import re
import shutil

def copy_file(src, dst):
    shutil.copyfile(src, dst)

def update_keys_in_json(directory, key_map):
    src_count = 0
    tbl_count = 0
    frm_count = 0
    sbt_count = 0

    def has_prefix(key, prefixes):
        return any(key.startswith(prefix) for prefix in prefixes)

    def update_translate_keys(obj, key_prefix):
        nonlocal src_count, tbl_count, frm_count, sbt_count
        prefixes = ["src_", "tbl_", "frm_", "sbt_"]
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key == 'translate' and isinstance(value, str) and '.' in value:
                    original_key = value.split('.', 1)[1]
                    if not has_prefix(original_key, prefixes):
                        if key_prefix == "src_":
                            src_count += 1
                        elif key_prefix == "tbl_":
                            tbl_count += 1
                        elif key_prefix == "frm_":
                            frm_count += 1
                        elif key_prefix == "sbt_":
                            sbt_count += 1

                        new_key = f"{key_prefix}{original_key}"
                        key_map[original_key] = new_key
                        obj[key] = f"RESOURCES.{new_key}"
                else:
                    update_translate_keys(value, key_prefix)
        elif isinstance(obj, list):
            for item in obj:
                update_translate_keys(item, key_prefix)

    for filename in os.listdir(directory):
        if filename.endswith(".json"):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r', encoding='utf-8') as file:
                data = json.load(file)

            if "search_keys" in data:
                update_translate_keys(data["search_keys"], "src_")
            if "table_keys" in data:
                update_translate_keys(data["table_keys"], "tbl_")
            if "form_keys" in data:
                update_translate_keys(data["form_keys"], "frm_")
            if "subTables" in data:
                update_translate_keys(data["subTables"], "sbt_")

            with open(filepath, 'w', encoding='utf-8') as file:
                json.dump(data, file, ensure_ascii=False, indent=4)

    return src_count, tbl_count, frm_count, sbt_count

def update_keys_in_file(txt_file, key_map):
    with open(txt_file, 'r', encoding='utf-8') as file:
        lines = file.readlines()

    updated_lines = []
    for line in lines:
        match = re.match(r'(\w+):\s*"([^"]*)",?', line.strip())
        if match:
            key = match.group(1).strip()
            value = match.group(2).strip()
            if key in key_map:
                new_key = key_map[key]
                updated_lines.append(f'{new_key}: "{value}",\n')
            else:
                updated_lines.append(line)
        else:
            updated_lines.append(line)

    with open(txt_file, 'w', encoding='utf-8') as file:
        file.writelines(updated_lines)

def main(views_path, ts_file_path, temp_file_path):
    # Step 1: Copy the content of it.ts to file_it.txt
    copy_file(ts_file_path, temp_file_path)
    
    # Step 2: Update keys in JSON files in the views directory
    key_map = {}
    src_count, tbl_count, frm_count, sbt_count = update_keys_in_json(views_path, key_map)
    
    # Step 3: Update keys in file_it.txt based on the modified keys in JSON
    update_keys_in_file(temp_file_path, key_map)
    
    # Step 4: Copy the updated content back to it.ts
    copy_file(temp_file_path, ts_file_path)
    
    # Print summary
    total_count = src_count + tbl_count + frm_count + sbt_count
    print(f"Total keys modified: {total_count}")
    print(f"src_ keys modified: {src_count}")
    print(f"tbl_ keys modified: {tbl_count}")
    print(f"frm_ keys modified: {frm_count}")
    print(f"sbt_ keys modified: {sbt_count}")

# Esempio di utilizzo
views_path = '/home/gcrozzolin/Development/onecompliance/dynamo-tables/views'  # Sostituisci con il percorso della cartella views
ts_file_path = '/home/gcrozzolin/Development/onecompliance/src/app/oc/i18n/it.ts'  # Sostituisci con il percorso del file it.ts
temp_file_path = '/home/gcrozzolin/Development/onecompliance/python/file_it.txt'  # Sostituisci con il percorso del file file_it.txt

main(views_path, ts_file_path, temp_file_path)
