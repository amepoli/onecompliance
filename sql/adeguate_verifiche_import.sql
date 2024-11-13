-- FUNCTION: entrasp.adeguate_verifiche_import(character varying)

-- DROP FUNCTION IF EXISTS entrasp.adeguate_verifiche_import(character varying);

CREATE OR REPLACE FUNCTION entrasp.adeguate_verifiche_import(
	codiceazienda character varying)
    RETURNS TABLE(id_verifica integer) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 
 
DECLARE codicepart varchar; 				domanda_4218 varchar;
		idsondaggio numeric; 				domanda_4223 varchar;
		idsomministrazione numeric; 		domanda_4225 varchar;
		verifica record; 					domanda_4226 varchar;
		maxidmodtestvr numeric;				domanda_4199 varchar;
		mt_titolo varchar;					domanda_4227 varchar;
		mt_documentazione varchar; 			domanda_4228 varchar;
		mt_idcentrogest numeric;			domanda_4221 varchar;
		maxidsnd numeric;					domanda_4222 varchar;
		maxidss numeric;					domanda_4224 varchar;
		show_when_PEP varchar;				domanda_4234 varchar;
		max_rsp numeric;					domanda_4220 varchar;
		i numeric := 0;						domanda_4219 varchar;			
		mt_provvisorio numeric := 1;
		Recs record;
		maxidanagrafica numeric;
		
		
BEGIN

SELECT codice_part FROM entrasp.aziende WHERE codice_azienda=codiceazienda INTO codicepart;

IF codicepart='FININT' or codicepart='DEMO' THEN
	 if codicepart='FININT' THEN mt_provvisorio=634; END IF;

--/* da attivare per debugging; altre tre condizioni per il debugging a riga 100 e 116 e 135
	--Elimino eventuali dati residui

	DELETE FROM imports.verifiche_anagrafiche_finint;
	DELETE FROM imports.verifiche_clienti_finint;
	DELETE FROM imports.verifiche_movimenti_finint;

	--Anagrafiche 
	
	
	PERFORM aws_s3.table_import_from_s3(
                    'imports.verifiche_anagrafiche_finint',
                    'ambiente, rapporto, fondo, cliente, legame, data_fine_legame, data_inizio_rapporto, data_fine_rapporto, cognome, nome, sesso, data_nascita, localita_nascita, provincia_nascita, paese_nascita, indirizzo_residenza, localita_residenza, provincia_residenza, cap_residenza, cab_residenza, paese_residenza, codice_fiscale, partita_iva, settore, ramo, sae, iban, classe_fondo, ateco, tipo_doc, numero_doc, rilasciato_da, data_rilascio, data_scadenza',
                    '(FORMAT CSV, DELIMITER E''~'', HEADER false)',
                    aws_commons.create_s3_uri('gorico2-migration', 'batch/finint/upload/a_out.csv','eu-central-1'));

	--Clienti
	PERFORM aws_s3.table_import_from_s3(
                    'imports.verifiche_clienti_finint',
                    'codice_rapporto, data_fine_rapporto, codice_banca, rete, codice_cliente, cognome, nome, tipo_legame, data_ricezione, tipo_verifica, data_verifica, natura_giuridica, tip_rapporto_di_lavoro, sede_legale, scopo_del_rapporto, com_tenuto_vecchia_gesti, mod_operat_vecchia_gesti, tipo_operazione, punteggio_rischio_riciclaggi, fascia_di_rischio_reciclaggi, natura_rapporto, tipologia_rapporto_professi, fascia_di_reddito, titolare_effettivo, motivaz_assenza_titolaref, tipo_societa, tipo_attivita, provincia_attivita, paese_attivita, persona_esposta_politicamen, codtipolperspolitesposta, codice_fiscale, partita_iva, codrepeconomico_amministr, codsituazione_patrimoniale, codrelazione_cli_esecutore, codrelazione_cli_titeff, provincia_attivita_secondar, paese_attivita_secondaria, indirizzo_domicilio, luogo_domicilio, provincia_domicilio, paese_domicilio, cap_domicilio, indirizzo_residenza_fiscale, luogo_residenza_fiscale, provincia_residenza_fiscale, paese_residenza_fiscale, cap__residenza_fiscale, rilevata_presenza_banc_onlin, iddatabase_banca_online, documento_rilasciato_estero, cittadinanza_2, paese_casa_madre, paese_relazione_di_lavoro_1, paese_relazione_di_lavoro_2, paese_relazione_di_lavoro_3', 
                    '(FORMAT CSV, DELIMITER E''~'', HEADER false)',
                    aws_commons.create_s3_uri('gorico2-migration', 'batch/finint/upload/c_out.csv','eu-central-1'));

	--Movimenti
	PERFORM aws_s3.table_import_from_s3(
                    'imports.verifiche_movimenti_finint',
                    'codice_rapporto, data_fine_rapporto, codice_banca, rete, codice_cliente, cognome, nome, numero_operazione, data_ricezione, data_regolamento, flag_validazione_rete, note_flag_validazione_rete, origine_fondi, paese_dest_fondi, provincia_dest_fondi, ragionevolezza_operazione, coerenza_invest_switch_clien, coerenza_invest_switch_patri, coerenza_econom_finanzclien, coerenza_attivi_profesclien, comportam_tenuto_sportello, modalità_operativa, importo_in_divcont, fondo', 
                    '(FORMAT CSV, DELIMITER E''~'', HEADER false)',
                    aws_commons.create_s3_uri('gorico2-migration', 'batch/finint/upload/m_out.csv','eu-central-1'));
--*/ da attivare per debugging	
	--inserisco tipo documento e date nella anagrafica corrispondente

SELECT coalesce(max(id_anagrafica),0) as massimo FROM entrasp.anagrafiche_id 
WHERE codice_part= codicepart 
iNTO maxidanagrafica;

-- query di insert per alimentare le anagrafiche delle persone fisiche (prima anagrafiche_id e poi anagrafiche_vr);

INSERT INTO entrasp.anagrafiche_id(codice_part, id_anagrafica, codice, nome, cognome, 
									data_ins, prog_vr_corr, flag_piva_md, 
									tipo_soggetto, sesso) 
select distinct codicepart, maxidanagrafica +row_number() over (ORDER BY cliente), cliente,  nome, cognome, 
									current_date, 1, 0, 
									case when sesso is null then 'E' else 'P' end, sesso 
from imports.verifiche_anagrafiche_finint
where cliente not in (select codice from entrasp.anagrafiche_id 
					where codice_part=codicepart and codice is not null)
on conflict do nothing;  

INSERT INTO entrasp.anagrafiche_vr(codice_part, id_anagrafica, prog_vr, ragione_sociale, denominazione, 
codice_fiscale, partita_iva, data_ins, 
codice, indirizzo, cap, nazione, comune, provincia, id_ateco, cod_sae)
SELECT DISTINCT codicepart, an.id_anagrafica, 1,  case when vaf.sesso is null then vaf.cognome else null end, coalesce(vaf.nome||' '||vaf.cognome, vaf.cognome),
vaf.codice_fiscale, vaf.partita_iva, current_date, 
vaf.cliente, vaf.indirizzo_residenza, vaf.cap_residenza, vaf.paese_residenza, vaf.localita_residenza, vaf.provincia_residenza,  atc.id_ateco, vaf.sae::NUMERIC
FROM imports.verifiche_anagrafiche_finint vaf
INNER JOIN entrasp.anagrafiche_id an on vaf.cliente=an.codice 
left join entrasp.ateco atc on vaf.ateco=atc.cod_ateco
WHERE an.codice_part=codicepart 
AND an.id_anagrafica NOT IN (
							SELECT id_anagrafica 
							FROM entrasp.anagrafiche_vr 
							WHERE codice_part=codicepart
							and id_anagrafica is not null
							) 
ON CONFLICT DO NOTHING;
/*
----
/*
for Rec in (select vr.ragione_sociale, vr.codice_fiscale, vr.partita_iva,  vr.indirizzo, vr.cap, vr.nazione, vr.codice, vr.comune, vr.provincia 
		from entrasp.anagrafiche_vr vr 
		where  vr.codice_part=codicepart and vr.codice in (select codcli from imports.anagrafiche_temporary) 
		and vr.prog_vr=(select max(vr2.prog_vr) from entrasp.anagrafiche_vr vr2 where vr2.codice_part=codicepart 
		and vr2.id_anagrafica=vr.id_anagrafica) 
		and vr.id_anagrafica=(select max(id_anagrafica) from entrasp.anagrafiche_vr vr3 where vr3.codice_part=codicepart and vr3.codice=vr.codice) 
		except select at.ragsoc, at.codfisc, at.piva, at.ind_sl, at.cap_sl, at.stato_sl, at.codcli, at.cittasl, at.prov_sl 
		from imports.anagrafiche_temporary at 
		where at.codcli in (select codice from entrasp.anagrafiche_vr where codice_part=codicepart)) loop
	
		select max(prog_vr) 
		from entrasp.anagrafiche_vr  
		where codice=Rec.codice and id_anagrafica=(select max(id_anagrafica) 
		from entrasp.anagrafiche_vr vr3 where vr3.codice_part=codicepart and vr3.codice=Rec.codice) into maxi;
		
		INSERT INTO entrasp.anagrafiche_vr(codice_part, id_anagrafica, prog_vr, ragione_sociale, denominazione, codice_fiscale, partita_iva, 
		data_ins, codice, indirizzo, cap, nazione, comune, provincia)
		select distinct codicepart, an.id_anagrafica, maxi+1,  ragsoc, coalesce(ragsoc, at.nome||' '||at.cognome), codfisc, piva, 
		current_date, codcli, ind_sl, cap_sl, stato_sl, cittasl, prov_sl   
		from imports.anagrafiche_temporary at 
		inner join entrasp.anagrafiche_id an on at.codcli=an.codice 
		where an.codice_part=codicepart and at.codcli=Rec.codice 
		and an.id_anagrafica=(select max(id_anagrafica) 
								from entrasp.anagrafiche_vr vr3 where vr3.codice_part=codicepart and vr3.codice=Rec.codice)	
		ON CONFLICT DO NOTHING;
	
end loop;  
*/

	
	SELECT entrasp.grc_max_id_mdt_vr(codiceazienda, mt_provvisorio), 
		   mt.titolo,
		   mt.documentazione_necessaria,
		   mt.id_centro_gest 
	FROM entrasp.modelli_test mt 
	WHERE mt.codice_azienda=codiceazienda
	AND mt.id_modello_test=mt_provvisorio 
	INTO maxidmodtestvr, mt_titolo, mt_documentazione, mt_idcentrogest;
	
	SELECT coalesce(max(id_sondaggio),0)+1
	FROM entrasp.sondaggi 
	WHERE codice_azienda=codiceazienda
	INTO maxidsnd;
	
	SELECT coalesce(max(id_somministrazione),0)+1
	FROM entrasp.sondaggi_somministrati 
	WHERE codice_azienda=codiceazienda
	INTO maxidss;
	
	FOR verifica IN
		(
			WITH max_date_verifica AS (
			    SELECT vcf2.codice_cliente,
			           MAX(vcf2.data_verifica) AS max_data_verifica
			    FROM imports.verifiche_clienti_finint vcf2
			    INNER JOIN imports.verifiche_movimenti_finint vmf2
			        ON vcf2.codice_cliente = vmf2.codice_cliente
			        AND vcf2.codice_rapporto = vmf2.codice_rapporto
			    WHERE vcf2.tipo_legame IN ('A', 'M')
				/* -- condizione temporanea per debugging
				and  vcf2.cognome ilike 'mengoni'		
				*/  -- condizione temporanea per debugging
			    GROUP BY vcf2.codice_cliente
			),
			latest_data_ricezione AS (
			    SELECT vcf.codice_cliente,
			           MAX(vcf.data_ricezione) AS max_data_ricezione,
			           max_date_verifica.max_data_verifica
			    FROM imports.verifiche_clienti_finint vcf
			    INNER JOIN max_date_verifica
			        ON vcf.codice_cliente = max_date_verifica.codice_cliente
			        AND vcf.data_verifica = max_date_verifica.max_data_verifica
			    INNER JOIN imports.verifiche_movimenti_finint vmf
			        ON vcf.codice_cliente = vmf.codice_cliente
			        AND vcf.codice_rapporto = vmf.codice_rapporto
			    /* -- condizione temporanea per debugging
				where  vcf.cognome ilike 'mengoni'		
				*/  -- condizione temporanea per debugging	
			    GROUP BY vcf.codice_cliente, max_date_verifica.max_data_verifica
			),
			valid_profiles AS (
			    SELECT an.codice || '-' || REPLACE(ss.data_esecuzione::varchar, '-', '') AS profile_key
			    FROM entrasp.sondaggi_somministrati ss
			    INNER JOIN entrasp.anagrafiche_id an
			        ON ss.codice_part = an.codice_part
			        AND SPLIT_PART(ss.object_key, '|', 2)::numeric = an.id_anagrafica
			    INNER JOIN entrasp.sondaggi snd
			        ON ss.codice_azienda = snd.codice_azienda
			        AND ss.id_sondaggio = snd.id_sondaggio
			    INNER JOIN entrasp.modelli_test mt
			        ON snd.codice_azienda = mt.codice_azienda
			        AND snd.id_modello_test = mt.id_modello_test
			    WHERE ss.codice_part = 'FININT'
			      AND mt.id_modello_test = 634
				  /*-- condizione temporanea per debugging
				   and an.id_anagrafica=4684
				  */-- condizione temporanea per debugging
			    GROUP BY an.codice, ss.data_esecuzione
			)
			SELECT vc.codice_cliente,
			       vc.data_verifica,
			       vc.data_ricezione,
			       cnt.id_cliente,
			       vc.tipo_verifica,
			       vc.natura_giuridica,
			       vc.scopo_del_rapporto,
			       vc.tipo_operazione,
			       vc.natura_rapporto,
			       vc.tipologia_rapporto_professi,
			       vc.titolare_effettivo,
			       vc.paese_attivita,
			       vc.persona_esposta_politicamen,
			       vc.codtipolperspolitesposta,
			       vc.codrelazione_cli_esecutore,
			       vc.codrelazione_cli_titeff,
			       vc.provincia_domicilio,
			       vc.paese_domicilio,
			       vc.paese_residenza_fiscale,
			       vc.rilevata_presenza_banc_onlin,
			       vc.provincia_attivita,
			       vc.provincia_residenza_fiscale,
			       va.cliente,
			       va.paese_nascita,
			       va.provincia_nascita,
			       va.sae,
			       va.ateco,
			       va.paese_residenza,
			       va.provincia_residenza,
			       STRING_AGG(DISTINCT vm.origine_fondi, ' - ') AS origine_fondi,
			       vm.paese_dest_fondi,
			       STRING_AGG(DISTINCT vm.ragionevolezza_operazione, ' - ') AS ragionevolezza_operazione,
			       STRING_AGG(DISTINCT vm.coerenza_invest_switch_clien, ' - ') AS coerenza_invest_switch_clien,
			       STRING_AGG(DISTINCT vm.coerenza_invest_switch_patri, ' - ') AS coerenza_invest_switch_patri,
			       STRING_AGG(DISTINCT vm.coerenza_econom_finanzclien, ' - ') AS coerenza_econom_finanzclien,
			       STRING_AGG(DISTINCT vm.coerenza_attivi_profesclien, ' - ') AS coerenza_attivi_profesclien,
			       vm.comportam_tenuto_sportello,
			       vm.modalità_operativa,
			       vm.provincia_dest_fondi
			FROM imports.verifiche_anagrafiche_finint va
			INNER JOIN imports.verifiche_clienti_finint vc
			    ON LTRIM(va.cliente, '0') = LTRIM(vc.codice_cliente, '0')
			INNER JOIN imports.verifiche_movimenti_finint vm
			    ON vc.codice_cliente = vm.codice_cliente
			    AND vc.codice_rapporto = vm.codice_rapporto
			    AND vm.data_ricezione IN (
			        SELECT MAX(data_ricezione)
			        FROM imports.verifiche_movimenti_finint
			        WHERE codice_cliente = vc.codice_cliente
			          AND codice_rapporto = vc.codice_rapporto
			    )
			INNER JOIN entrasp.contratti cnt
			    ON SUBSTRING(cnt.numero_contratto, 0, STRPOS(cnt.numero_contratto, SPLIT_PART(cnt.numero_contratto, '-', 3)) - 1) = TRIM(va.ambiente || '-' || LPAD(va.rapporto, 8, '0'))
			    AND cnt.id_cliente = (
			        SELECT DISTINCT id_anagrafica
			        FROM entrasp.anagrafiche_vr
			        WHERE codice = LPAD(va.cliente, 8, '0')
			          AND codice_part = codicepart
			    )
			WHERE vc.tipo_legame IN ('A', 'M')
			  AND COALESCE(TRIM(vc.rete, '0'), '') != '7'
			  AND vc.data_verifica != '0'
			  AND cnt.codice_azienda = codiceazienda
			  AND cnt.stato != 'C'
			  AND vc.data_verifica::varchar || '-' || vc.data_ricezione::varchar IN (
			    SELECT max_data_verifica::varchar || '-' || max_data_ricezione::varchar
			    FROM latest_data_ricezione
			  )
			  AND vc.codice_cliente || '-' || vc.data_ricezione NOT IN (SELECT profile_key FROM valid_profiles)
			  AND entrasp.is_expired_profile(codiceazienda, cnt.id_cliente)
			   /* -- condizione temporanea per debugging
			  and  va.cognome ilike 'mengoni'	
			  and  vc.cognome ilike 'mengoni'		
			  */  -- condizione temporanea per debugging	
			GROUP BY vc.codice_cliente, vc.data_verifica, vc.data_ricezione, cnt.id_cliente, vc.tipo_verifica, vc.natura_giuridica, 
			         vc.scopo_del_rapporto, vc.tipo_operazione, vc.natura_rapporto, vc.tipologia_rapporto_professi, vc.titolare_effettivo,
			         vc.paese_attivita, vc.persona_esposta_politicamen, vc.codtipolperspolitesposta, vc.codrelazione_cli_esecutore, 
			         vc.codrelazione_cli_titeff, vc.provincia_domicilio, vc.paese_domicilio, vc.paese_residenza_fiscale, 
			         vc.rilevata_presenza_banc_onlin, vc.provincia_attivita, vc.provincia_residenza_fiscale, va.cliente, 
			         va.paese_nascita, va.provincia_nascita, va.sae, va.ateco, va.paese_residenza, va.provincia_residenza, 
			         vm.paese_dest_fondi, vm.comportam_tenuto_sportello, vm.modalità_operativa, vm.provincia_dest_fondi
			ORDER BY vc.codice_cliente DESC

		)
	LOOP

	--	raise notice 'cliente: %', verifica.cliente;
			/**************************************************************CREO NUOVO SONDAGGIO**************************************************************/
			INSERT INTO entrasp.sondaggi 
				(codice_azienda,  id_sondaggio, id_modello_test, id_modello_test_vr,    titolo,					  																	 	descrizione,		         data_prevista, data_esecuzione, documentazione_analizzata,  id_centro_gest,  stato,                                           data_comp,           id_anagrafica, data_inserimento ) 
			VALUES 	
				(codiceazienda, maxidsnd+i,  mt_provvisorio,     maxidmodtestvr, mt_titolo, mt_titolo||' relativo al cliente: '||entrasp.anagrafiche_vr_dati_identificativi(codicepart,verifica.id_cliente),verifica.data_ricezione::date,  verifica.data_ricezione::date, mt_documentazione, mt_idcentrogest,    'C', entrasp.last_day_year(verifica.data_verifica::date), verifica.id_cliente, CURRENT_DATE );

			/************************************************************CREO NUOVA SOMMINISTRAZIONE**********************************************************/
			INSERT INTO entrasp.sondaggi_somministrati
				 (codice_azienda, id_sondaggio, id_somministrazione, 	          data_esecuzione, id_anagrafica,  	  object_name, 				   object_key, 											     object_description, 			 stato, data_inserimento )
			VALUES
				 ( codiceazienda, 	maxidsnd+i,			  maxidss+i, verifica.data_ricezione::date, 	   verifica.id_cliente, 'anagraficheId', codicepart||'|'||verifica.id_cliente, entrasp.anagrafiche_vr_dati_identificativi(codicepart,verifica.id_cliente),   	'C', CURRENT_DATE );

			/**************************************************************INSERISCO LE RISPOSTE**************************************************************/

			/*Azzero variabili*/
			domanda_4219:='';
			domanda_4227:='';
			domanda_4228:='';
			show_when_PEP:='';
			SELECT coalesce(max(id_risposta),0) FROM entrasp.risposte WHERE codice_azienda=codiceazienda INTO max_rsp;

			IF 	  verifica.natura_giuridica IN ('0', 'A') 	THEN domanda_4218:='ND'; domanda_4219 = coalesce(ltrim(verifica.tipologia_rapporto_professi,'0'),'N/A');
			ELSIF  verifica.titolare_effettivo = '1' 								   THEN	domanda_4218:='1';  
			ELSEIF   verifica.titolare_effettivo = '0' 								   THEN	domanda_4218:='0'; domanda_4227:=coalesce(verifica.codrelazione_cli_titeff,'N/A') ;domanda_4228:=coalesce(verifica.codrelazione_cli_esecutore,'N/A'); 
			ELSE 				/*verifica.titolare_effettivo = null THEN*/					domanda_4218='N/A'; 
			END IF;

			SELECT entrasp.cod_ext_nazione_finint(ltrim(verifica.paese_nascita,'0')) INTO domanda_4220;
			SELECT entrasp.cod_ext_nazione_finint(ltrim(verifica.paese_attivita,'0')) INTO domanda_4221;
			SELECT entrasp.cod_ext_nazione_finint(ltrim(verifica.paese_residenza,'0')) INTO domanda_4222;
			SELECT entrasp.cod_ext_nazione_finint(ltrim(verifica.paese_residenza_fiscale,'0')) INTO domanda_4224;
			SELECT entrasp.cod_ext_nazione_finint(ltrim(verifica.paese_dest_fondi,'0')) INTO domanda_4234;

			IF verifica.provincia_residenza IS NOT NULL THEN 
				SELECT CASE WHEN verifica.provincia_residenza IN (SELECT sigla_provincia from entrasp.province WHERE flag_a_rischio = true ) THEN 'S' ELSE 'N' END INTO domanda_4223; 
			ELSE domanda_4223 := 'N/A'; 
			END IF;

			IF verifica.sae IS NOT NULL THEN 
			SELECT CASE WHEN verifica.sae::numeric IN (SELECT cod_sae::numeric from entrasp.sae WHERE cod_rischio = 1) THEN 'S' ELSE 'N' END INTO domanda_4225; 						
			ELSE domanda_4225 := 'N/A';
			END IF;

			IF verifica.ateco IS NOT NULL THEN 
				SELECT CASE WHEN verifica.ateco IN (SELECT cod_ateco from entrasp.ateco WHERE cod_rischio = 1) THEN 'S' ELSE 'N' END INTO domanda_4226; 			
			ELSE domanda_4226 := 'N/A';
			END IF;

			IF verifica.persona_esposta_politicamen = 'S' THEN 
				show_when_PEP := 4231||'~'||coalesce(verifica.codtipolperspolitesposta,'N/A') ; 	
			END IF;

		--	raise notice 'show_when_PEP: %', show_when_PEP;
			
			perform disable_triggers('entrasp.risposte');
			/* INSERT in risposte */ 
			INSERT INTO entrasp.risposte(
					codice_azienda, id_modello_test, 									      	 
					id_risposta,    																			   
					risposta,   
					id_domanda,   
					id_risposta_prev, 	  
					object_name, 							  
					object_key,   
					id_sondaggio, id_somministrazione,  punteggio,	
					peso, 
					id_modello_test_vr,  
					note )
			select 	codiceazienda,   mt_provvisorio, 
					max_rsp + row_number() over (order by id_risposta_prev), 
					CASE WHEN b.id_domanda = 4199 THEN verifica.data_verifica::date::text ELSE NULL END, 
					b.id_domanda, 
					a.id_risposta_prev, 
					'anagraficheId', 
					codicepart||'|'||verifica.id_cliente,	  
					maxidsnd+i, maxidss+i, b.punteggio, 
					CASE 	WHEN b.id_domanda = 4221 AND verifica.paese_attivita is null AND verifica.natura_giuridica !='0' AND verifica.natura_giuridica != 'A' THEN 100.00 ELSE a.peso END, 
					maxidmodtestvr,
			-- il case che segue è riferito alle note
				CASE 	WHEN b.id_domanda IN (4220) AND a.cod_ext = '86' 	THEN (SELECT r.descrizione FROM entrasp.regioni r INNER JOIN entrasp.province p ON r.codice_regione=p.codice_regione WHERE p.sigla_provincia = verifica.provincia_nascita) 
					WHEN b.id_domanda IN (4220) AND a.cod_ext != '86'  	THEN verifica.paese_nascita
					WHEN b.id_domanda IN (4221) AND a.cod_ext = '86'  	THEN (SELECT r.descrizione FROM entrasp.regioni r INNER JOIN entrasp.province p ON r.codice_regione=p.codice_regione WHERE p.sigla_provincia = verifica.provincia_attivita)
					WHEN b.id_domanda IN (4221) AND a.cod_ext != '86'  	THEN verifica.paese_attivita
					WHEN b.id_domanda IN (4222) AND a.cod_ext = '86'  	THEN (SELECT r.descrizione FROM entrasp.regioni r INNER JOIN entrasp.province p ON r.codice_regione=p.codice_regione WHERE p.sigla_provincia = verifica.provincia_residenza)
					WHEN b.id_domanda IN (4222) AND a.cod_ext != '86'  	THEN verifica.paese_residenza
					WHEN b.id_domanda IN (4223) 						THEN (SELECT descrizione FROM entrasp.province WHERE sigla_provincia = UPPER(verifica.provincia_residenza))
					WHEN b.id_domanda IN (4224) AND a.cod_ext = '86' 	THEN (SELECT r.descrizione FROM entrasp.regioni r INNER JOIN entrasp.province p ON r.codice_regione=p.codice_regione WHERE p.sigla_provincia = verifica.provincia_residenza_fiscale)
					WHEN b.id_domanda IN (4224) AND a.cod_ext != '86'  	THEN verifica.paese_residenza_fiscale
					WHEN b.id_domanda IN (4225)						    THEN verifica.sae
					WHEN b.id_domanda IN (4226)  						THEN verifica.ateco
					WHEN b.id_domanda IN (4234) AND a.cod_ext = '86'  	THEN (SELECT r.descrizione FROM entrasp.regioni r INNER JOIN entrasp.province p ON r.codice_regione=p.codice_regione WHERE p.sigla_provincia = verifica.provincia_dest_fondi)
					WHEN b.id_domanda IN (4234) AND a.cod_ext != '86'  	THEN verifica.paese_dest_fondi
					ELSE null END
			from entrasp.risposte_previste a 
			inner join entrasp.domande b on a.codice_azienda=b.codice_azienda and a.id_domanda = b.id_domanda 
			and a.id_modello_test=b.id_modello_test AND a.id_modello_test_vr=b.id_modello_test_vr
			where a.codice_azienda=codiceazienda and a.id_modello_test=mt_provvisorio and a.id_modello_test_vr = maxidmodtestvr
			--and b.id_argomento||'~'||a.cod_ext IN
			and b.id_domanda||'~'||a.cod_ext IN
			(	
			/***SEZIONE 1***/
			4175||'~'||coalesce(verifica.natura_giuridica,'N/A'),
			4218||'~'||domanda_4218,
			4219||'~'||domanda_4219,
			4220||'~'||coalesce(domanda_4220,'N/A'),	--  qui
			4221||'~'||coalesce(domanda_4221,'N/A'),	--	qui				
			4222||'~'||coalesce(domanda_4222,'N/A'), 	--	qui						
			4223||'~'||domanda_4223,
			4224||'~'||coalesce(domanda_4224,'N/A'),    --	qui
			4225||'~'||domanda_4225,
			4226||'~'||domanda_4226,
			4227||'~'||domanda_4227,
			4228||'~'||domanda_4228,

			/***SEZIONE 2***/
			4230||'~'||coalesce(verifica.persona_esposta_politicamen,'N/A'),
			show_when_PEP,										
			4232||'~'||coalesce(verifica.rilevata_presenza_banc_onlin,'N/A'),	 
			4233||'~'||coalesce(split_part(verifica.origine_fondi,' - ',1),'N/A'),
			4234||'~'||coalesce(domanda_4234,'N/A'), 

			/***SEZIONE 3***/
			4198||'~'||coalesce(verifica.modalità_operativa,'N/A'),			
			4199||'~'||'dt_ver',								 			
			4200||'~'||coalesce(verifica.tipo_verifica,'N/A'), 	 			 
			4201||'~'||coalesce(verifica.comportam_tenuto_sportello,'N/A'),

			/***SEZIONE 4***/
			4212||'~'||coalesce(verifica.scopo_del_rapporto,'N/A'),				
			4213||'~'||coalesce(verifica.natura_rapporto,'N/A'),				
			4214||'~'||coalesce(verifica.tipo_operazione,'N/A'),
			4215||'~'||coalesce(split_part(verifica.coerenza_invest_switch_clien,' - ',1),'N/A'),	
			4216||'~'||coalesce(split_part(verifica.coerenza_econom_finanzclien,' - ',1),'N/A'),
			4257||'~'||coalesce(split_part(verifica.coerenza_invest_switch_patri,' - ',1),'N/A'),
			4258||'~'||coalesce(split_part(verifica.coerenza_attivi_profesclien,' - ',1),'N/A'),
			4259||'~'||coalesce(split_part(verifica.ragionevolezza_operazione,' - ',1),'N/A')	
			);

			perform enable_triggers('entrasp.risposte');

			raise notice 'here with sondaggio somministrazione sezione % %', maxidsnd+i,maxidss+i;
			FOR Recs IN (SELECT id_sezione FROM entrasp.sondaggi_somministrati_risultati_sezioni WHERE codice_azienda=codiceazienda AND id_sondaggio=maxidsnd+i AND id_somministrazione=maxidss+i) LOOP
				raise notice 'in with sezione %', Recs.id_sezione;
				PERFORM entrasp.aggiorna_punteggi_somministrazioni(codiceazienda, maxidsnd+i, maxidss+i, Recs.id_sezione);
			END LOOP;
			
			/* id sondaggio succ? 
			IF (SELECT COUNT(id_somministrazione) 
				FROM entrasp.sondaggi_somministrati
				WHERE codice_azienda = codiceazienda AND id_anagrafica = verifica.id_cliente AND id_contratto = verifica.id_contratto AND data_inserimento IS NOT NULL 
				AND id_modello_test=mt_provvisorio
		  	   ) > 1 THEN
			
				/*UPDATE entrasp.sondaggi_somministrati SET id_sondaggio_succ=maxidsnd+i, id_somministrazione_succ=maxidss+i
				WHERE codice_azienda=codiceazienda 
				AND id_somministrazione = ( SELECT id_somministrazione
											FROM entrasp.sondaggi_somministrati
											WHERE codice_azienda = codiceazienda AND id_anagrafica = verifica.id_cliente AND id_contratto = verifica.id_contratto 
											AND data_inserimento IS NOT NULL
											AND id_sondaggio_succ IS NULL AND id_somministrazione_succ IS NULL
										  );*/
				
				raise notice 'snd, ss%', maxidsnd+i||', '||maxidss+i;
				
			END IF;*/
			--Incremento l'indice
			i := i + 1; 	
			
	END LOOP;
	--Fine inserimento verifiche
	
	/*******************************************************INSERISCO I DOCUMENTI ASSOCIATI****************************************************************/
	UPDATE entrasp.anagrafiche_vr a 
	SET id_argomento_tipo_documento = (SELECT CASE 
							   WHEN b.tipo_doc = '01' THEN 45398 --carta d'identità
							   WHEN b.tipo_doc = 'CI' THEN 45398	
							   WHEN b.tipo_doc = '03' THEN 45399 --passaporto
							   WHEN b.tipo_doc = 'PT' THEN 45400 --patente
							   WHEN b.tipo_doc = '02' THEN 45400
							   WHEN b.tipo_doc = '04' THEN 45404
							   WHEN b.tipo_doc = '05' THEN 45405
							   WHEN b.tipo_doc = '06' THEN 3981
							   ELSE null END),
	data_scadenza_documento = (SELECT to_date(nullif(b.data_scadenza,'0'), 'DD-MM-YYYY')),
	data_rilascio_documento = (SELECT to_date(nullif(b.data_rilascio,'0'), 'DD-MM-YYYY')),
	numero_documento = b.numero_doc,
	rilasciato_da = b.rilasciato_da
	FROM imports.verifiche_anagrafiche_finint b
	WHERE a.codice=lpad(b.cliente,8,'0')
	AND codice_part='FININT'
	AND a.prog_vr=entrasp.anagrafiche_vr_max(a.codice_part, a.id_anagrafica)
	AND a.id_argomento_tipo_documento IS NULL
	AND a.numero_documento IS NULL
	AND b.numero_doc IS NOT NULL;
	
	
	-- Creo nuova versione anagrafica se cambia il documento
	INSERT INTO entrasp.anagrafiche_vr (codice_part, id_anagrafica, prog_vr, ragione_sociale, denominazione, partita_iva, codice_fiscale, provincia, comune, cap, indirizzo, data_inizio_validita, codice, data_ins, data_upd, id_ateco, cod_sae, id_argomento_tipo_documento, data_scadenza_documento, data_rilascio_documento, numero_documento, rilasciato_da,annotazioni_interne) 
	
	SELECT DISTINCT a.codice_part,
							a.id_anagrafica,
							a.prog_vr+1,
							a.ragione_sociale,
							a.denominazione,
							a.partita_iva,
							a.codice_fiscale,
							a.provincia,
							a.comune,
							a.cap,
							a.indirizzo,
							CURRENT_DATE,
							a.codice,
							CURRENT_DATE,
							CURRENT_DATE,
							a.id_ateco,
							b.sae::numeric, (
								SELECT CASE WHEN b.tipo_doc = '01' THEN 45398 --carta d'identità
																				WHEN b.tipo_doc = 'CI' THEN 45398 
																				WHEN b.tipo_doc = '03' THEN 45399 --passaporto
																				WHEN b.tipo_doc = 'PT' THEN 45400 --patente
																				WHEN b.tipo_doc = '02' THEN 45400 
																				WHEN b.tipo_doc = '04' THEN 45404 
																				WHEN b.tipo_doc = '05' THEN 45405 
																				WHEN b.tipo_doc = '06' THEN 3981 
																				ELSE NULL 
																					END
							), (
								SELECT to_date(nullif(b.data_scadenza,'0'), 'DD-MM-YYYY')
							), (
								SELECT to_date(nullif(b.data_rilascio,'0'), 'DD-MM-YYYY')
							), b.numero_doc, 
							b.rilasciato_da,
							a.annotazioni_interne
		FROM entrasp.anagrafiche_vr a 
	INNER JOIN imports.verifiche_anagrafiche_finint b 
				ON a.codice=lpad(b.cliente,8,'0') 
	WHERE codice_part='FININT' 
			AND a.prog_vr=entrasp.anagrafiche_vr_max(a.codice_part, a.id_anagrafica) 
			AND a.id_argomento_tipo_documento IS NOT NULL 
			AND a.numero_documento IS NOT NULL 
			AND b.numero_doc IS NOT NULL 
			AND b.numero_doc||'-'||TO_CHAR(TO_DATE(b.data_scadenza, 'DD/MM/YYYY'), 'YYYY-MM-DD')||'-'||TO_CHAR(TO_DATE(b.data_rilascio, 'DD/MM/YYYY'), 'YYYY-MM-DD')||'-'||(SELECT CASE WHEN b.tipo_doc = '01' THEN 45398 --carta d'identità
																				WHEN b.tipo_doc = 'CI' THEN 45398 
																				WHEN b.tipo_doc = '03' THEN 45399 --passaporto
																				WHEN b.tipo_doc = 'PT' THEN 45400 --patente
																				WHEN b.tipo_doc = '02' THEN 45400 
																				WHEN b.tipo_doc = '04' THEN 45404 
																				WHEN b.tipo_doc = '05' THEN 45405 
																				WHEN b.tipo_doc = '06' THEN 3981 
																				ELSE NULL 
																					END) NOT IN (
								SELECT DISTINCT trim (numero_documento)||'-'||trim (data_scadenza_documento::TEXT)||'-'||trim (data_rilascio_documento::TEXT)||'-'||trim (id_argomento_tipo_documento::TEXT)
										FROM entrasp.anagrafiche_vr 
									WHERE codice_part='FININT'
											AND id_anagrafica=a.id_anagrafica
											and numero_documento||'-'||data_scadenza_documento||'-'||data_rilascio_documento is not null
							)on conflict do nothing;
							
							/*condizione modificata in data 27/02/2024 prendendo l'ipotesi che l'ultimo documento sia esatto, 
							la modifica interviene per creare una versione per ogni volta che una componente del documento viene modificata
							 */
*/
END IF;

END;
 
 
$BODY$;

ALTER FUNCTION entrasp.adeguate_verifiche_import(character varying)
    OWNER TO postgres;
