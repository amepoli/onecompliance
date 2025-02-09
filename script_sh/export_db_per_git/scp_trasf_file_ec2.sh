nome_file="export_functions_v2.sh"
nome_file2="export_trigger_functions_v2.sh"
nome_file3="export_tables_v2.sh"
nome_file4="merge_sql_files.sh"

scp -i "/opt/keys/cdk-ec2-user.pem" "/home/apoli/Development/onecompliance/script_sh/export_db_per_git/$nome_file" ec2-user@18.193.201.111:/home/ec2-user/Database/$nome_file
scp -i "/opt/keys/cdk-ec2-user.pem" "/home/apoli/Development/onecompliance/script_sh/export_db_per_git/$nome_file2" ec2-user@18.193.201.111:/home/ec2-user/Database/$nome_file2
scp -i "/opt/keys/cdk-ec2-user.pem" "/home/apoli/Development/onecompliance/script_sh/export_db_per_git/$nome_file3" ec2-user@18.193.201.111:/home/ec2-user/Database/$nome_file3
scp -i "/opt/keys/cdk-ec2-user.pem" "/home/apoli/Development/onecompliance/script_sh/export_db_per_git/$nome_file4" ec2-user@18.193.201.111:/home/ec2-user/Database/$nome_file4
