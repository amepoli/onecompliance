select id_sondaggio, data_esecuzione from entrasp.sondaggi where codice_azienda='FININTSGR' and id_modello_test=634 and data_esecuzione>'2024-11-28'

--CAMPESE: il giudizio è lo stesso le risposte sono le stesse
-- Nessuna differenza. Il giudizio è lo stesso


select rsp.id_risposta_prev, rsp.note   
from entrasp.risposte rsp
where rsp.id_sondaggio=1858 and rsp.codice_azienda='FININTSGR'

select rsp.id_risposta_prev, rsp.note
from r20241128.risposte rsold
where rsold.id_sondaggio=1858 and rsold.codice_azienda='FININTSGR'

select rsp.id_risposta_prev, rsp.note, rsold.id_risposta_prev, rsold.note
from entrasp.risposte rsp
inner join  
	(
	select codice_azienda, id_modello_test, id_modello_test_vr, id_domanda, id_risposta_prev, note
	from r20241128.risposte 
	where id_sondaggio=1858 and codice_azienda='FININTSGR'
	) rsold
	on rsp.codice_azienda=rsold.codice_azienda and rsp.id_modello_test=rsold.id_modello_test and rsp.id_modello_test_vr=rsold.id_modello_test_vr
	and rsp.id_domanda=rsold.id_domanda and rsp.id_risposta_prev=rsold.id_risposta_prev
where rsp.id_sondaggio=1858 and rsp.codice_azienda='FININTSGR'

--SPORTELLI GIANCARLO id_an=3900: il giudizio è lo stesso le risposte sono le stesse
-- Nessuna differenza. Il giudizio è lo stesso


select rsp.id_risposta_prev, rsp.note   
from entrasp.risposte rsp
where rsp.id_sondaggio=7120 and rsp.codice_azienda='FININTSGR'

select rsold.id_risposta_prev, rsold.note
from r20241128.risposte rsold
where rsold.id_sondaggio=7120 and rsold.codice_azienda='FININTSGR'

select rsp.id_risposta_prev, rsp.note, rsold.id_risposta_prev, rsold.note
from entrasp.risposte rsp
inner join  
	(
	select codice_azienda, id_modello_test, id_modello_test_vr, id_domanda, id_risposta_prev, note
	from r20241128.risposte 
	where id_sondaggio=7120 and codice_azienda='FININTSGR'
	) rsold
	on rsp.codice_azienda=rsold.codice_azienda and rsp.id_modello_test=rsold.id_modello_test and rsp.id_modello_test_vr=rsold.id_modello_test_vr
	and rsp.id_domanda=rsold.id_domanda and rsp.id_risposta_prev=rsold.id_risposta_prev
where rsp.id_sondaggio=7120 and rsp.codice_azienda='FININTSGR'

-- Giudizi ad oggi
select pct_da, pct_da_manuale from entrasp.sondaggi_somministrati
where id_sondaggio=1858 and codice_azienda='FININTSGR'

-- Giudizi al 28/11/2024
select pct_da, pct_da_manuale from r20241128.sondaggi_somministrati
where id_sondaggio=1858 and codice_azienda='FININTSGR'


select * 
FROM entrasp.individua_profilazioni_in_eccesso('FININTSGR', 634)
		where d_k_del='Delete' and  (codiceaz_orig, idsond_del) NOT IN (
                SELECT sdc2.codiceaz_orig, sdc2.idsond_del 
                from entrasp.individua_profilazioni_in_eccesso('FININTSGR', 634) sdc2
				where d_k_del='Keep'
            );

---- gilari danila doriana (cliente 4552 relativo a sondaggio 6120 che abbiamo ripristinato ma che continua a cancellarsi) 
select * 
FROM entrasp.individua_profilazioni_in_eccesso('FININTSGR', 634, 'FININT|4552')
		where d_k_del='Delete' and  (codiceaz_orig, idsond_del) NOT IN (
                SELECT sdc2.codiceaz_orig, sdc2.idsond_del 
                from entrasp.individua_profilazioni_in_eccesso('FININTSGR', 634, 'FININT|4552') sdc2
				where d_k_del='Keep'
            );

select entrasp.cancella_profilazioni_in_eccesso_v2('FININTSGR', 634, 'FININT|4552');

select entrasp.ripristina_sondaggi('FININTSGR',6120,'r20241128','entrasp')

select * from entrasp.sondaggi where id_sondaggio=6120 and codice_azienda='FININTSGR';
-----


---- viorca russu (cliente relativo a sondaggio 5804 che abbiamo ripristinato ma che continua a cancellarsi)
select entrasp.cancella_profilazioni_in_eccesso_v2('FININTSGR', 634, 'FININT|4366');

select * 
FROM entrasp.individua_profilazioni_in_eccesso('FININTSGR', 634, 'FININT|4366')
		where d_k_del='Delete' and  (codiceaz_orig, idsond_del) NOT IN (
                SELECT sdc2.codiceaz_orig, sdc2.idsond_del 
                from entrasp.individua_profilazioni_in_eccesso('FININTSGR', 634, 'FININT|4366') sdc2
				where d_k_del='Keep'
            );

select entrasp.ripristina_sondaggi('FININTSGR',5804,'r20241128','entrasp')

select * from entrasp.sondaggi where id_sondaggio=5804 and codice_azienda='FININTSGR';

----




select * from entrasp.query_utili
where parole_chiave ilike '%ripristino%'

select entrasp.ripristina_sondaggi('DEMO', 181, 'r20241128', 'entrasp')