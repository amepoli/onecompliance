nome_file="ripristino_ultimo_backup_per_test.sh"
scp -i "/opt/keys/cdkdev-ec2-user.pem" "/home/apoli/Development/onecompliance/script_sh/$nome_file" ec2-user@3.124.34.69:/home/ec2-user/$nome_file