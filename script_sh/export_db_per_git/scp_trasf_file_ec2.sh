nome_file="export_functions.sh"

scp -i "/opt/keys/cdk-ec2-user.pem" "/home/apoli/Development/onecompliance/script_sh/export_db_per_git/$nome_file" ec2-user@18.193.201.111:/home/ec2-user/Database/$nome_file
