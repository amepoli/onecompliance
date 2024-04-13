select entrasp.sposta_nc_nei_pagamenti('RE-CREDIT', 53831)

select id_cessione, data_pagamento, codice_azienda, capitale_residuo_leg
from entrasp.crediti_ceduti
where codice_azienda='RE-CREDIT' and id_cessione=17104


select 20 between 11 and 20

select id_cedente, codice_part, entrasp.anagrafiche_cognnome(codice_part, id_cedente), count(id_cessione) 
from entrasp.crediti_ceduti
where codice_azienda='RE-CREDIT'	
group by id_cedente, codice_part
order by codice_part, count(id_cessione) desc

select cc.codice_azienda, cc.id_cessione, capitale_residuo_leg, data_pagamento
from entrasp.crediti_ceduti cc
where cc.codice_azienda||cc.id_cedente
in (select distinct cc2.codice_azienda||cc2.id_cedente	
from entrasp.crediti_ceduti cc2
where cc2.codice_azienda='RE-CREDIT'
group by cc2.id_cedente, cc2.codice_azienda
	having count(cc2.id_cessione) between 21 and )

SET session_replication_role = replica;	
select entrasp.crediti_ceduti_aggiorna(cc.codice_azienda, cc.id_cessione)
from entrasp.crediti_ceduti cc
where cc.codice_azienda||cc.id_cedente
in (select distinct cc2.codice_azienda||cc2.id_cedente	
from entrasp.crediti_ceduti cc2
where cc2.codice_azienda='RE-CREDIT'
group by cc2.id_cedente, cc2.codice_azienda
	having count(cc2.id_cessione) between 1001 and 1400);
SET session_replication_role = DEFAULT;

select entrasp.crediti_ceduti_aggiorna(tab.codice_azienda, tab.id_cessione)
from

	
select distinct cc.codice_azienda, cc.id_cessione, capitale_residuo, importo, capitale_residuo_leg, data_pagamento
from entrasp.crediti_ceduti cc
where cc.codice_azienda||cc.id_cedente
in (select distinct cc2.codice_azienda||cc2.id_cedente	
from entrasp.crediti_ceduti cc2
where cc2.codice_azienda='RE-CREDIT'
group by cc2.id_cedente, cc2.codice_azienda
	having count(cc2.id_cessione) <10)
