--AML_6165102 numero clienti persone giuridiche per nazione di residenza
select count (id_anagrafica), entrasp.nazione_descr_bdi(nazione::numeric)
from entrasp.estrazione_profili_aml
where codice_azienda='FINAFARM' 
and tipo_soggetto='E'
group by nazione 

--AML_6165104	numero clienti persone fisiche per nazione di residenza
select count (id_anagrafica), entrasp.nazione_descr_bdi(nazione::numeric)
from entrasp.estrazione_profili_aml
where codice_azienda='FINAFARM' 
and tipo_soggetto='P'
group by nazione

-- rapporti attivi persone giuridiche
select count
	(distinct cnt.id_contratto),
	entrasp.nazione_descr(avr.codice_nazione)
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on avr.codice_part=cnt.codice_part
	and avr.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and avr.prog_vr=entrasp.anagrafiche_vr_max (an.codice_part, an.id_anagrafica)
	and ru.codice_ruolo='CLI'
	and cnt.stato!='C'
	and an.tipo_soggetto='E'
	and cnt.id_argomento_contratto!=49580
group by
	avr.codice_nazione;


-- rapporti attivi persone Fisiche

select count
	(distinct cnt.id_contratto),
	entrasp.nazione_descr(avr.codice_nazione)
from
	entrasp.anagrafiche_id an
	inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part
	and an.id_anagrafica=avr.id_anagrafica
	inner join entrasp.contratti cnt on avr.codice_part=cnt.codice_part
	and avr.id_anagrafica=cnt.id_cliente
	inner join entrasp.ruoli_anagrafiche ru on an.codice_part=ru.codice_part
	and an.id_anagrafica=ru.id_anagrafica
where
	an.codice_part='FINAFARM'
	and avr.prog_vr=entrasp.anagrafiche_vr_max (an.codice_part, an.id_anagrafica)
	and ru.codice_ruolo='CLI'
	and cnt.stato!='C'
	and an.tipo_soggetto='P'
	and cnt.id_argomento_contratto!=49580
group by
	avr.codice_nazione;
