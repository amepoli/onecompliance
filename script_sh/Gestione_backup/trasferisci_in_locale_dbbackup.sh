nome_file="gorico_prod-1_last.backup"

# Trasferisco il file di backup dal server remoto al server locale
scp -i /opt/keys/cdk-ec2-user.pem ec2-user@18.193.201.111:/home/ec2-user/sftp/customers/backups/$nome_file /home/apoli/Development/onecompliance/script_sh/Gestione_backup/$nome_file
