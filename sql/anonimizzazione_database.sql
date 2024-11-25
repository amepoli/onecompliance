-- aggiornare le consuntivazioni.
-- Le righe del time report stanno nella tabella consuntivazioni
-- La tabella consuntivazioni ha una chiave esterna sulla tabella anagrafiche_id (che contiene il campo dynamo_user) e il collegamento è per codice_part e id_risorsa
--Quindi ad esempio se voglio trovare tutte le ore fatte da GC

select an.dynamo_user, csn.codice_azienda, csn.id_cons, csn.durata, csn.date_time_begin, csn.date_time_end
from entrasp.consuntivazioni csn
inner join entrasp.anagrafiche_id an
on csn.codice_part=an.codice_part and csn.id_risorsa=an.id_anagrafica
where an.dynamo_user ilike '%crozzolin%'

-- Voglio anonimizzare ad esempio le ore di GC

-- PASSO 1 (Una tantum) (che serve per tutti). Inserisco nella tabella anagrafiche_id per ogni partizione l'anagrafica con id_anagrafica -1 con Nome='Anonimo' e Cognome 'Anonimo' e dynamo_user='aninimo'

-- PASSO 2 Faccio un update sulla tabella entrasp.consuntivazioni portando id_risorsa a -1 in relazione al "dominio" che voglio anonimizzare.
-- Ad esempio se voglio anonimizzare tutte le ore di gianmarco crozzolin precedentemente ad una determinata data
update entrasp.consuntivazioni csn
set id_risorsa=-1
from entrasp.anagrafiche_id an
where an.dynamo_user ilike '%crozzolin%'  
and csn.codice_part=an.codice_part and csn.id_risorsa=an.id_anagrafica
and data_intervento <='2023-11-25'

--- Voglio anonimizzare le aziende TEST e DEMO in prod e tutto in DEV.

update entrasp.anagrafiche_id
set nome = 'nome '||id_anagrafica::varchar, nome = 'cognome '||id_anagrafica::varchar, 
where codice_part not in ('DEMO', 'TEST');

update entrasp.anagrafiche_vr
set denominazione = 'denominazione '||id_anagrafica::varchar, ragione_sociale = 'ragione_sociale '||id_anagrafica::varchar,
ragione_sociale2 = 'ragione_sociale2 '||id_anagrafica::varchar,
where codice_part in ('TEST', 'DEMO');














