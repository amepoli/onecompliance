sourcedir="/home/apoli/Development/onecompliance/script_sh/Gestione_backup/"
destdir="/home/ec2-user/backupdb/"

scp -i "/opt/keys/cdk-ec2-user.pem" "$sourcedir" -r ec2-user@18.193.201.111:$destdir
