SELECT cron.schedule('0 14 * * *', $$CALL aggiorna_tr_QUANTYX();$$);
											 
SELECT jobid, schedule, command, active
FROM cron.job
WHERE active = true;


SELECT cron.schedule('36 14 * * *', $$SELECT dblink_exec('dbname=onecompliance', 'CALL entrasp.aggiorna_tr_QUANTYX();')$$);

SELECT dblink_exec('postgres-onecompliance-amedeo', 'CALL entrasp.aggiorna_tr_QUANTYX();')

SELECT dblink_exec('postgres-onecompliance', 'CALL entrasp.aggiorna_tr_QUANTYX();')

select current_time;

SELECT dblink_connect('postgres-onecompliance-amedeo', 'host=occdkstackprod-onecomplianceauroraclusterinstance1-klwbw9k3gy8r.caxbbckt9xen.eu-central-1.rds.amazonaws.com port=5432 dbname=onecompliance user=amedeo password=latuapassword');

SELECT dblink_connect('postgres-onecompliance', 'host=occdkstackprod-onecomplianceauroraclusterinstance1-klwbw9k3gy8r.caxbbckt9xen.eu-central-1.rds.amazonaws.com port=5432 dbname=onecompliance user=postgres password=lapassworddipostgres');
