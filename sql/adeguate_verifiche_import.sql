	select entrasp.contratti_insert_from_contratti_temporary('FININTSGR');
 select entrasp.adeguate_verifiche_import('FININTSGR');
 select * from entrasp.contratti_anagrafiche_id where codice_ruolo = 'COINT';
 select distinct nome, cognome from imports.verifiche_anagrafiche_finint where cliente not in 
  						(select codice from entrasp.anagrafiche_id an INNER JOIN entrasp.contratti_anagrafiche_id ca ON an.codice_part = ca.codice_part 
 						 												AND an.id_anagrafica=ca.id_anagrafica WHERE an.codice_part='FININT'
 																		and an.codice is not null)

 select distinct * from entrasp.contratti where numero_contratto ilike '%1983%';


 select sum(entrasp.anagrafiche_vr_max(codice_part, id_anagrafica))
 from entrasp.anagrafiche_id
 where codice_part='FININT'; 536291

/*
update entrasp.anagrafiche_vr vr
set  ragione_sociale=case when vaf.sesso is null then vaf.cognome else null end,
	 denominazione=coalesce(vaf.nome||' '||vaf.cognome, vaf.cognome), 
		codice_fiscale=vaf.codice_fiscale,
		partita_iva=vaf.partita_iva, 
		indirizzo=vaf.indirizzo_residenza, 
		cap=cap_residenza, 
		nazione=paese_residenza, 
		comune=localita_residenza, 
		provincia=provincia_residenza
from imports.verifiche_anagrafiche_finint vaf
where vr.prog_vr=entrasp.anagrafiche_vr_max(vr.codice_part, vr.id_anagrafica)
and vr.codice_part='FININT' and vaf.cliente=vr.codice;





select vr.ragione_sociale, 
		vr.denominazione, 
		vr.codice_fiscale, vr.partita_iva,  
		vr.indirizzo, vr.cap, 
		vr.nazione, vr.comune, 
		vr.provincia 
		from entrasp.anagrafiche_vr vr 
		where  vr.codice_part=codicepart and vr.codice in (select cliente from imports.verifiche_anagrafiche_finint) 
		and vr.prog_vr=(select max(vr2.prog_vr) from entrasp.anagrafiche_vr vr2 where vr2.codice_part=codicepart 
		and vr2.id_anagrafica=vr.id_anagrafica) 
		and vr.id_anagrafica=(select max(id_anagrafica) from entrasp.anagrafiche_vr vr3 where vr3.codice_part=codicepart and vr3.codice=vr.codice) 
		except select case when vaf.sesso is null then vaf.cognome else null end, 
		coalesce(vaf.nome||' '||vaf.cognome, vaf.cognome), 
		vaf.codice_fiscale, vaf.partita_iva, 
		vaf.indirizzo_residenza, vaf.cap_residenza, 
		vaf.paese_residenza, vaf.localita_residenza, 
		vaf.provincia_residenza 
		FROM imports.verifiche_anagrafiche_finint vaf
		where vaf.cliente in (select codice from entrasp.anagrafiche_vr where codice_part=codicepart)




select vr.ragione_sociale, vr.codice_fiscale, vr.partita_iva,  vr.indirizzo, vr.cap, vr.nazione, vr.codice, vr.comune, vr.provincia 
		from entrasp.anagrafiche_vr vr 
		where  vr.codice_part=codicepart and vr.codice in (select cliente from imports.verifiche_anagrafiche_finint) 
		and vr.prog_vr=(select max(vr2.prog_vr) from entrasp.anagrafiche_vr vr2 where vr2.codice_part=codicepart 
		and vr2.id_anagrafica=vr.id_anagrafica) 
		and vr.id_anagrafica=(select max(id_anagrafica) from entrasp.anagrafiche_vr vr3 where vr3.codice_part=codicepart and vr3.codice=vr.codice) 
		except select vaf.cognome, vaf.codice_fiscale, vaf.partita_iva, vaf.indirizzo_residenza, vaf.cap_residenza, vaf.paese_residenza, vaf.localita_residenza, vaf.localita_residenza, vaf.provincia_residenza 
		FROM imports.verifiche_anagrafiche_finint vaf
		where vaf.cliente in (select codice from entrasp.anagrafiche_vr where codice_part=codicepart)

		*/