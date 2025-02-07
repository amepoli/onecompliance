nome_file="export_functions.sh"

scp -i "/opt/keys/cdkdev-ec2-user.pem" "/home/apoli/Development/onecompliance/script_sh/export_db_per_git/$nome_file" ec2-user@3.124.34.69:/home/ec2-user/Jasper/$nome_file
