nome_file="create_fdw_db_ripristino_ultimo_backup.sh"

scp -i "/opt/keys/cdk-ec2-user.pem" "/home/apoli/Development/onecompliance/script_sh/$nome_file" ec2-user@18.193.201.111:/home/ec2-user/$nome_file
