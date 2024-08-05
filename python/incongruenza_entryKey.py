import os
import json

def find_mismatched_json_keys(directory_path):
    for root, _, files in os.walk(directory_path):
        for file in files:
            if file.endswith('.json'):
                file_path = os.path.join(root, file)
                with open(file_path, 'r') as f:
                    try:
                        data = json.load(f)
                        # Assuming the entry key is the top-level key
                        entry_key = list(data.keys())[0]
                        file_name_without_extension = os.path.splitext(file)[0]
                        if entry_key != file_name_without_extension:
                            print(f"File: {file} | Entry Key: {entry_key}")
                    except json.JSONDecodeError:
                        print(f"Error decoding JSON in file: {file_path}")

# Replace 'your_directory_path' with the actual path of your directory
directory_path = '/home/eongaro/Desktop/Development/onecompliance/dynamo-tables/views'
find_mismatched_json_keys(directory_path)
