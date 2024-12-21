select codice_azienda, id_cons,codice_compito, id_risorsa, entrasp.anagrafiche_cognnome(codice_part, id_risorsa),
entrasp.id_anagrafica_corrispondente(codice_part, id_risorsa, 'AUDITFT') as id_an_aft,
		entrasp.id_anagrafica_corrispondente(codice_part, id_risorsa, 'FININT') as id_an_finint
from entrasp.consuntivazioni
where (codice_compito, codice_azienda) in (
									  values('465', 'ALACRITAS'),
											('229', 'FININTSGR'));


select entrasp.compito_change_azienda('FININTSGR', '229', 'ALACRITAS');

select entrasp.compito_change_azienda('ALACRITAS', '465', 'FININTSGR');


select codice_part, id_anagrafica, entrasp.anagrafiche_cognnome(codice_part, id_anagrafica), 
		entrasp.id_anagrafica_corrispondente(codice_part, id_anagrafica, 'AUDITFT') as id_an_aft,
		entrasp.id_anagrafica_corrispondente(codice_part, id_anagrafica, 'FININT') as id_an_finint

		from entrasp.anagrafiche_id
		where (codice_part, id_anagrafica)
				in(
				values ('AUDIFT', 72), 
					   ('FININT', 72),
					   ('FININT', 33)
					);	