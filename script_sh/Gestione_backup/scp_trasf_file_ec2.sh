nome_file="A.1-regular_restore_db_backup.sh"

scp -i "/opt/keys/cdk-ec2-user.pem" "/home/apoli/Development/onecompliance/script_sh/Gestione_backup/$nome_file" ec2-user@18.193.201.111:/home/ec2-user/backupdb/$nome_file
