delete from entrasp.contratti_anagrafiche_id
where (codice_part, codice_azienda, id_contratto,
    id_anagrafica,
    codice_ruolo,
    data_inizio_validita) in (
	with ranked_duplicates as (
    select
        *,
        row_number() over (
            partition by codice_part, codice_azienda, id_contratto, id_anagrafica, codice_ruolo
            order by data_inizio_validita
        ) as rnk
    from
        entrasp.contratti_anagrafiche_id
)
select
    *
from
    ranked_duplicates
where
    rnk > 1
order by
    codice_part, codice_azienda, id_contratto, id_anagrafica, codice_ruolo, data_inizio_validita;

) ;

ALTER TABLE entrasp.contratti_anagrafiche_id
ADD CONSTRAINT pk_contratti_anagrafiche_id
PRIMARY KEY (codice_part, id_anagrafica, codice_azienda, id_contratto);

create unique index unique_contratti_anagrafiche
on entrasp.contratti_anagrafiche_id (codice_part, id_anagrafica, codice_azienda, id_contratto, codice_ruolo)
where codice_ruolo is not null;


select distinct codice_azienda from entrasp.contratti_anagrafiche_id


select entrasp.anagrafiche_cognnome(codice_part, id_anagrafica), *  from entrasp.contratti_anagrafiche_id
where codice_azienda='FININTSGR' and id_anagrafica not in(select id_cliente from entrasp.contratti where id_cliente is not null and codice_azienda='FININTSGR')


select * from entrasp.contratti_anagrafiche_id
where id_contratto=3 and id_anagrafica=258 and codice_ruolo='COINT'
order by 
    id_contratto, id_anagrafica, codice_ruolo, data_inizio_validita;

select * from entrasp.contratti_anagrafiche_id
where id_contratto=5 and id_anagrafica=429 and codice_ruolo='COINT'
order by 
    id_contratto, id_anagrafica, codice_ruolo, data_inizio_validita;


	select distinct username, last_update
	from entrasp.utenti_aziende