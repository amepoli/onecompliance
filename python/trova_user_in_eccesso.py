# test per cercare file json locali non associati all'elemento su dynamo tables
import os
import json

def get_dynamo_user_ids():
    command = "aws dynamodb scan --table-name users_stage --attributes-to-get userid"
    result = os.popen(command).read()
    response = json.loads(result)
    items = response['Items']
    user_ids = {item['userid']['S'] for item in items}  # 'S' denotes string type in DynamoDB
    return user_ids

def get_json_files_from_directory(directory):
    json_files = [f for f in os.listdir(directory) if f.endswith('.json')]
    return json_files

def get_user_id_from_json(file_path):
    try:
        with open(file_path, 'r') as file:
            data = json.load(file)
            return data.get('userid')
    except (json.JSONDecodeError, IOError):
        return None

def main():
    directory = '/home/apoli/Development/onecompliance/dynamo-tables/users'  # Path to the directory containing JSON files
    output_file = 'missing_files.txt'

    dynamo_user_ids = get_dynamo_user_ids()
    json_files = get_json_files_from_directory(directory)

    missing_files = ['Missing file:']
    invalid_json_files = []


    for json_file in json_files:
         #print(json_file)
        file_path = os.path.join(directory, json_file)
        user_id = get_user_id_from_json(file_path)
        # print(user_id)
        if user_id is None:
            invalid_json_files.append(json_file)
        elif user_id not in dynamo_user_ids:
            missing_files.append(json_file)

    with open(output_file, 'w') as file:
        for missing_file in missing_files:
            file.write(f"{missing_file}\n")
        file.write("Invalid File: \n" )
        for invalid_file in invalid_json_files:
            file.write(f"{invalid_file}\n")       

   

    print(f"Missing files list saved to {output_file}")

if __name__ == "__main__":
    main()
