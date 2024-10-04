DROP TRIGGER IF EXISTS before_sondaggi ON entrasp.sondaggi RESTRICT;
ALTER TABLE entrasp.sondaggi DROP COLUMN codice_part RESTRICT;
ALTER TABLE entrasp.sondaggi ADD COLUMN codice_part character varying
GENERATED ALWAYS AS (entrasp.codice_part_from_azienda(codice_azienda)) STORED;



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
		
		
BEGIN

SELECT codice_part FROM entrasp.aziende WHERE codice_azienda=codiceazienda INTO codicepart;

IF codicepart='FININT' or codicepart='DEMO' THEN
	 if codicepart='FININT' THEN mt_provvisorio=634; END IF;
	
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
	
	--inserisco tipo documento e date nella anagrafica corrispondente

	--Inserimento verifiche
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
								string_agg(DISTINCT vm.origine_fondi,' - ') AS origine_fondi,
								vm.paese_dest_fondi,
								string_agg(DISTINCT vm.ragionevolezza_operazione,' - ') AS ragionevolezza_operazione,
								string_agg(DISTINCT vm.coerenza_invest_switch_clien,' - ') AS coerenza_invest_switch_clien,
								string_agg(DISTINCT vm.coerenza_invest_switch_patri,' - ') AS coerenza_invest_switch_patri,
								string_agg(DISTINCT vm.coerenza_econom_finanzclien,' - ') AS coerenza_econom_finanzclien,
								string_agg(DISTINCT vm.coerenza_attivi_profesclien,' - ') AS coerenza_attivi_profesclien,
								vm.comportam_tenuto_sportello,
								vm.modalità_operativa,
								vm.provincia_dest_fondi
			FROM imports.verifiche_anagrafiche_finint va
		INNER JOIN imports.verifiche_clienti_finint vc
					ON ltrim(va.cliente,'0') = ltrim(vc.codice_cliente,'0')
		INNER JOIN imports.verifiche_movimenti_finint vm
					ON vc.codice_cliente = vm.codice_cliente
				AND vc.codice_rapporto=vm.codice_rapporto
-- 				AND vc.data_ricezione=vm.data_ricezione
				AND vm.data_ricezione IN (SELECT max(data_ricezione) FROM imports.verifiche_movimenti_finint where codice_cliente=vc.codice_cliente AND codice_rapporto=vc.codice_rapporto)
		INNER JOIN entrasp.contratti cnt
					ON substring(cnt.numero_contratto, 0, strpos(cnt.numero_contratto,split_part(cnt.numero_contratto, '-', 3))-1) = trim(va.ambiente || '-' || lpad(va.rapporto,8,'0'))
				AND cnt.id_cliente = (
									SELECT DISTINCT id_anagrafica
											FROM entrasp.anagrafiche_vr
										WHERE codice = lpad(va.cliente, 8, '0')
												AND codice_part = codicepart
												
								)
		WHERE vc.tipo_legame IN ('A','M')
				AND coalesce(trim(vc.rete,'0'),'') != '7'
				AND vc.data_verifica != '0'
				AND cnt.codice_azienda = codiceazienda
				AND cnt.stato != 'C'
				
/****Modifica effettuata in data 26/02/2024 per gestire il fatto che il max data verifica e il max data ricezione non siano relativi allo stesso rapporto.
Inoltre che il max data verifica sia associato ad un codice_rapporto non inserito nella tabella imports.verifiche_movimenti_finint (motivo per l'inner join con verifiche_movimenti) */
AND vc.data_verifica::varchar||'-'||vc.data_ricezione::varchar in (
with dt as (
								select vcf2.codice_cliente,
											 max(vcf2.data_verifica) as maxdataverifica
								from imports.verifiche_clienti_finint vcf2
			inner join imports.verifiche_movimenti_finint vmf2
					ON vcf2.codice_cliente = vmf2.codice_cliente
				AND vcf2.codice_rapporto=vmf2.codice_rapporto
									where vcf2.tipo_legame in ('A', 'M')
									and vcf2.codice_cliente= vc.codice_cliente
									group by vcf2.codice_cliente
							) 
		select dt.maxdataverifica::varchar||'-'||max (vcf.data_ricezione)::varchar
		from imports.verifiche_clienti_finint vcf
		inner join dt
				on vcf.codice_cliente=dt.codice_cliente
				and vcf.data_verifica=dt.maxdataverifica
		inner join imports.verifiche_movimenti_finint vmf 
					ON vcf.codice_cliente = vmf.codice_cliente
				AND vcf.codice_rapporto=vmf.codice_rapporto
		group by dt.maxdataverifica
				)	
			/*
				Aggiunta fatta il 06/03/2024 per risolvere il problema della moltiplicazione delle profilazioni uguali
				*/
				and vc.codice_cliente||'-'||vc.data_ricezione not in (
				select an.codice||'-'||replace (ss.data_esecuzione::varchar,'-','') from entrasp.sondaggi_somministrati ss 
				inner join entrasp.anagrafiche_id an on ss.codice_part=an.codice_part and split_part (ss.object_key, '|',2)::numeric=an.id_anagrafica
				inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio
				inner join entrasp.modelli_test mt on snd.codice_azienda=mt.codice_azienda and snd.id_modello_test=mt.id_modello_test	
				where ss.codice_part='FININT' and mt.id_modello_test=634 and an.codice||'-'||ss.data_esecuzione is not null
				group by an.codice, ss.data_esecuzione)
/****************************************************************************************************************************************************************/				
				
			/*AND vc.data_verifica IN (
									SELECT max(vcin.data_verifica)
											FROM imports.verifiche_clienti_finint vcin
										WHERE vcin.codice_cliente=vc.codice_cliente
										and vcin.tipo_legame in ('A','M') --Riga aggiunta in data 01/02/24 per gestire se la data verifica più recente non sia A o M

								)
				AND vc.data_ricezione IN (
									SELECT max(vcin.data_ricezione)
											FROM imports.verifiche_clienti_finint vcin
										WHERE vcin.codice_cliente=vc.codice_cliente
											and vcin.tipo_legame in ('A','M')  --Riga aggiunta in data 14/02/24 
								)*/
			

				AND entrasp.is_expired_profile(codiceazienda,cnt.id_cliente)
		GROUP BY vc.codice_cliente,
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
											vm.paese_dest_fondi,
											vm.comportam_tenuto_sportello,
											vm.modalità_operativa,
											vm.provincia_dest_fondi
		ORDER BY vc.codice_cliente DESC
		)
	LOOP
		
			/**************************************************************CREO NUOVO SONDAGGIO**************************************************************/
			INSERT INTO entrasp.sondaggi 
				(codice_azienda,   id_sondaggio, id_modello_test, id_modello_test_vr,    titolo,					  																	 	descrizione,		         data_prevista, data_esecuzione, documentazione_analizzata,  id_centro_gest,  stato,                                           data_comp,           id_anagrafica, data_inserimento ) 
			VALUES 	
				(codiceazienda,  maxidsnd+i,  mt_provvisorio,     maxidmodtestvr, mt_titolo, mt_titolo||' relativo al cliente: '||entrasp.anagrafiche_vr_dati_identificativi(codicepart,verifica.id_cliente),verifica.data_ricezione::date,  verifica.data_ricezione::date, mt_documentazione, mt_idcentrogest,    'C', entrasp.last_day_year(verifica.data_verifica::date), verifica.id_cliente, CURRENT_DATE );

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

			IF verifica.persona_esposta_politicamen = 'S' THEN show_when_PEP := ' 4231||'~'||''coalesce(verifica.codtipolperspolitesposta,''N/A'')'' '; END IF;

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
			inner join entrasp.domande b on a.codice_azienda=b.codice_azienda and a.id_domanda = b.id_domanda and a.id_modello_test=b.id_modello_test AND a.id_modello_test_vr=b.id_modello_test_vr
			where a.codice_azienda=codiceazienda and a.id_modello_test=mt_provvisorio and a.id_modello_test_vr = maxidmodtestvr
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
	INSERT INTO entrasp.anagrafiche_vr (codice_part, id_anagrafica, prog_vr, ragione_sociale, denominazione, partita_iva, codice_fiscale, provincia, comune, cap, indirizzo, data_inizio_validita, codice, data_ins, data_upd, id_ateco, cod_sae, id_argomento_tipo_documento, data_scadenza_documento, data_rilascio_documento, numero_documento, rilasciato_da) SELECT DISTINCT a.codice_part,
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
							b.rilasciato_da 
		FROM entrasp.anagrafiche_vr a 
	INNER JOIN imports.verifiche_anagrafiche_finint b 
				ON a.codice=lpad(b.cliente,8,'0') 
	WHERE codice_part='FININT' 
			AND a.prog_vr=entrasp.anagrafiche_vr_max(a.codice_part, a.id_anagrafica) 
			AND a.id_argomento_tipo_documento IS NOT NULL 
			AND a.numero_documento IS NOT NULL 
			AND b.numero_doc IS NOT NULL 
			AND b.numero_doc||'-'||b.data_scadenza||'-'||b.data_rilascio||'-'||b.tipo_doc NOT IN (
								SELECT DISTINCT numero_documento||'-'||data_scadenza_documento||'-'||data_rilascio_documento||'-'||id_argomento_tipo_documento
										FROM entrasp.anagrafiche_vr 
									WHERE codice_part='FININT'
											AND id_anagrafica=a.id_anagrafica
											and numero_documento||'-'||data_scadenza_documento||'-'||data_rilascio_documento is not null
							)on conflict do nothing;/*condizione modificata in data 27/02/2024 prendendo l'ipotesi che l'ultimo documento sia esatto, 
							la modifica interviene per creare una versione per ogni volta che una componente del documento viene modificata
							 */
/*							
	--Elimino dati
	DELETE FROM imports.verifiche_anagrafiche_finint;
	DELETE FROM imports.verifiche_clienti_finint;
	DELETE FROM imports.verifiche_movimenti_finint;
*/

END IF;

END;
 
 
$BODY$;

ALTER FUNCTION entrasp.adeguate_verifiche_import(character varying)
    OWNER TO postgres;

-- FUNCTION: entrasp.aggiorna_sondaggi_pre_loading(character varying, numeric)

-- DROP FUNCTION IF EXISTS entrasp.aggiorna_sondaggi_pre_loading(character varying, numeric);

CREATE OR REPLACE FUNCTION entrasp.aggiorna_sondaggi_pre_loading(
	codiceazienda character varying,
	idsondaggio numeric)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
declare punteggioottenuto numeric; punteggiomassimo numeric; idrisultato numeric; pctrisultatoottenuto numeric; peso numeric; punteggio numeric; nonapplicabile integer; 
giudizio_ varchar; pctda numeric; snd_completato varchar; pctrisultatoworst numeric; giudizioworst varchar; pctdaworst numeric;
begin

--	raise notice 'aggiorna_sondaggi_pre_loading';
-- aggiorno la versione del sondaggio alla massima disponibile a condizione che il sondaggio sia non chiuso e non ci siano già risposte date

/*
	update entrasp.sondaggi snd
	set id_modello_test_vr=entrasp.modello_test_vr_max(codice_azienda, id_modello_test)
	where codice_azienda=codiceazienda and id_sondaggio=idsondaggio and stato!='C' 
	and mantieni_versione_corrente='0'
	and not exists(select id_sondaggio
				   from entrasp.risposte 
					where codice_azienda=codiceazienda and id_sondaggio=idsondaggio); 
*/
--	raise notice 'riga 28';

/*					
	SELECT entrasp.ricalcola_punteggi_sondaggi_aperti(snd.codice_azienda, snd.id_sondaggio)	
	from entrasp.sondaggi snd
	where snd.codice_azienda=codiceazienda and snd.id_sondaggio=idsondaggio and stato!='C' 
	and not exists(select id_sondaggio
				   from entrasp.risposte 
					where codice_azienda=codiceazienda and id_sondaggio=idsondaggio); 
	
*/
	select avg(coalesce(ss.pct_da_manuale, ss.ris_percentuale)), max(somministrazione_completata)
    from entrasp.sondaggi_somministrati ss 
    where ss.codice_azienda=codiceazienda and ss.id_sondaggio=idsondaggio and ss.ris_percentuale is not null 
	into pctrisultatoottenuto, snd_completato;

	raise notice 'pctrisultatoottenuto: %', round(pctrisultatoottenuto, 2);
    
    /*select punteggio_percentuale from entrasp.punteggio_sondaggio_somministrazione_worst(codiceazienda, idsondaggio) 
    into pctrisultatoworst;
    */
	select mvr.id_risultato 
    from entrasp.sondaggi snd inner join entrasp.modelli_test_vr mvr on snd.id_modello_test=mvr.id_modello_test 
    and snd.id_modello_test_vr=mvr.id_modello_test_vr and snd.codice_azienda=mvr.codice_azienda
	where snd.id_sondaggio=idsondaggio and snd.codice_azienda=codiceazienda into idrisultato;
--		raise notice 'riga 54';
	
	select mtr.pct_da, mtr.descrizione 
    from entrasp.modelli_test_risultati_righe_da_punteggio_ottenuto(codiceazienda, idrisultato,pctrisultatoottenuto) mtr 
	into pctda, giudizio_;
    /*
    select mtr.pct_da, mtr.descrizione 
    from entrasp.modelli_test_risultati_righe_da_punteggio_ottenuto(codiceazienda, idrisultato,pctrisultatoworst) mtr into pctdaworst, giudizioworst;
*/
/*	raise notice 'idrisultato: %', idrisultato;
	raise notice 'pctrisultatoottenuto: %', pctrisultatoottenuto;
	raise notice 'giudizio: %', giudizio_;
	raise notice 'pctda: %', pctda;
*/

	update entrasp.sondaggi snd
	set ris_percentuale=pctrisultatoottenuto, 
	pct_da= pctda, 
	giudizio= giudizio_,/*
    ris_percentuale_worst=pctrisultatoworst, 
	pct_da_worst= pctdaworst, 
	giudizio_worst= giudizioworst,*/
--	giudizio_manuale=entrasp.modelli_test_risultati_righe_descr(idrisultato, pct_da_manuale, snd.codice_azienda),
	sondaggio_completato=snd_completato
	from entrasp.aziende az
	where snd.codice_azienda=az.codice_azienda and snd.id_sondaggio=idsondaggio and snd.codice_azienda=codiceazienda;
	
	update entrasp.sondaggi set titolo_cartella=left(entrasp.replace_strings(titolo, array['Verifica', 'verifica', 'sulla ', 'sulle ', 'correttezza ', 'rispetto ', 
																				  'Controlli', 'Controllo',
																				  'completezza ', 'tempestivita ', 'adempimenti ', 'di ', 'della ', 'delle', 
																				  'sulla ', 'sulle', 'sull',
																				  'degli ', 'il', 'del ', 'la ', 'lo ', '"'], ''), 40)
	where titolo_cartella is null and codice_azienda=codiceazienda and id_sondaggio=idsondaggio;
	
-- 	raise notice 'riga 93';
	
-- disattivato perchè creava cicli infiniti a seguito dei trigger sulla tabella compiti a loro volta triggerati da progetti_fasi
/*
	perform entrasp.progetti_fasi_stato_update(codice_azienda, id_progetto)
	from entrasp.progetti_fasi where codice_azienda=codiceazienda and id_sondaggio=idsondaggio;
	
*/	
	
	

end ;
$BODY$;

ALTER FUNCTION entrasp.aggiorna_sondaggi_pre_loading(character varying, numeric)
    OWNER TO postgres;
-- FUNCTION: entrasp.crea_singola_verifica(character varying, numeric, text, character varying, character varying, date, date, character varying, numeric)

-- DROP FUNCTION IF EXISTS entrasp.crea_singola_verifica(character varying, numeric, text, character varying, character varying, date, date, character varying, numeric);

CREATE OR REPLACE FUNCTION entrasp.crea_singola_verifica(
	codiceazienda character varying,
	idmodellotest numeric,
	objectdescription text DEFAULT NULL::text,
	objectname character varying DEFAULT NULL::character varying,
	objectkey character varying DEFAULT NULL::character varying,
	dataprevista date DEFAULT NULL::date,
	datariferimento date DEFAULT NULL::date,
	titolo_ character varying DEFAULT NULL::character varying,
	idsondaggio_origin numeric DEFAULT NULL::numeric)
    RETURNS TABLE(codaz character varying, idsnd numeric, idss numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 

DECLARE
maxi numeric;						id_anagrafica_societa numeric; 
maxi_id_risorsa numeric;			codicepart varchar; 
max_ss numeric; 					datacompetenza date; 
idmodellotestvr numeric;			idcentrogest numeric;
Rec record;							i int default 1;
                

BEGIN

	SELECT codice_part FROM entrasp.aziende WHERE codice_azienda=codiceazienda 														INTO codicepart;
	SELECT COALESCE(MAX(id_sondaggio),0) FROM entrasp.sondaggi WHERE codice_azienda=codiceazienda									INTO maxi;
	SELECT COALESCE(MAX(id_somministrazione),0) FROM entrasp.sondaggi_somministrati WHERE codice_azienda=codiceazienda 				INTO max_ss;
	SELECT MAX(id_modello_test_vr) FROM entrasp.modelli_test_vr WHERE codice_azienda = codiceazienda AND id_modello_test=idmodellotest INTO idmodellotestvr;
	SELECT date_trunc('year', CURRENT_DATE::date) + interval '12 month' - interval '1 day' 											INTO datacompetenza;
	SELECT id_anagrafica FROM entrasp.aziende WHERE codice_azienda=codiceazienda 													INTO id_anagrafica_societa;

	SELECT id_centro_gest, coalesce(titolo_, titolo) 
	FROM entrasp.modelli_test 
	WHERE codice_azienda = codiceazienda AND id_modello_test=idmodellotest 	
	INTO idcentrogest, titolo_;
	
	
	INSERT INTO entrasp.sondaggi
	(codice_azienda, id_sondaggio, id_modello_test, id_modello_test_vr, 				  	     
	 titolo, 												descrizione, 					  data_prevista, data_riferimento_a, 
	 id_centro_gest, stato,			  data_comp, id_sondaggio_parent) 
	VALUES
	( codiceazienda,	   maxi+1, 	 idmodellotest,    idmodellotestvr, 
	 coalesce(titolo_,'Da definire'), coalesce(titolo_, 'Da definire'),  coalesce(dataprevista,CURRENT_DATE),    datariferimento,   
	 idcentrogest,   'P',   datacompetenza::date, idsondaggio_origin) ;

    INSERT INTO entrasp.sondaggi_somministrati 
    (codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione,    	                         id_anagrafica,      					   object_name, 			 					         	    object_key, 		  										                 							  object_description ) 
    VALUES 
    ( codiceazienda, 	  maxi+1, 		    max_ss + 1,    coalesce(dataprevista,CURRENT_DATE), id_anagrafica_societa,  coalesce(objectname,'anagraficheId'), coalesce(objectkey,codicepart||'|'||id_anagrafica_societa), coalesce(objectdescription,(select entrasp.anagrafiche_vr_dati_identificativi(codicepart, id_anagrafica_societa))));
	
	RETURN QUERY SELECT codiceazienda,maxi+1,max_ss+1;

END
 
$BODY$;

ALTER FUNCTION entrasp.crea_singola_verifica(character varying, numeric, text, character varying, character varying, date, date, character varying, numeric)
    OWNER TO postgres;

-- FUNCTION: entrasp.crea_sondaggio_multiplo(character varying, numeric, date, date, character varying, numeric)

-- DROP FUNCTION IF EXISTS entrasp.crea_sondaggio_multiplo(character varying, numeric, date, date, character varying, numeric);

CREATE OR REPLACE FUNCTION entrasp.crea_sondaggio_multiplo(
	codiceazienda character varying,
	idmodellotest numeric,
	dataprevista date DEFAULT NULL::date,
	datariferimento date DEFAULT NULL::date,
	titolo_ character varying DEFAULT NULL::character varying,
	idargomentoevento numeric DEFAULT NULL::numeric)
    RETURNS integer
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$

DECLARE idmodellotestvr numeric; 					idargomento numeric; 							idcentrogest numeric;
		documentazionenecessaria text; 				codicepart varchar;
		max_snd numeric;							max_ss numeric;
		datacompetenza date;						arg_risposte numeric [];
		count_somministrazioni integer := 0;		Rec record;
		i int := 1;									id_anagrafica_societa numeric;  
		iddomanda integer;							max_idrisposta numeric;
		risposta_ numeric;

BEGIN	

	SELECT entrasp.grc_max_id_mdt_vr(codiceazienda, idmodellotest), coalesce(titolo_, mt.titolo), 
	mt.documentazione_necessaria, mt.id_centro_gest, mt.id_argomento 
	FROM entrasp.modelli_test mt 
	WHERE mt.codice_azienda=codiceazienda AND mt.id_modello_test=idmodellotest 
	INTO idmodellotestvr, titolo_, 
	documentazionenecessaria, idcentrogest, idargomento;
	
	SELECT codice_part FROM entrasp.aziende WHERE codice_azienda=codiceazienda INTO codicepart;
	SELECT coalesce(max(id_sondaggio),0)+1 FROM entrasp.sondaggi WHERE codice_azienda = codiceazienda INTO max_snd;
	SELECT coalesce(max(id_somministrazione),0) FROM entrasp.sondaggi_somministrati WHERE codice_azienda = codiceazienda INTO max_ss;
	SELECT date_trunc('year', current_date::date) + interval '12 month' - interval '1 day' INTO datacompetenza;
	
	/*Inserisco SONDAGGIO*/
	INSERT INTO entrasp.sondaggi 
	(codice_azienda, id_sondaggio, id_modello_test, id_modello_test_vr, 						  
	 titolo, descrizione, 
	 data_prevista,                              data_riferimento_a, documentazione_analizzata, 
	 id_centro_gest, stato, data_comp ) 
	VALUES 
	( codiceazienda, 	   max_snd,   idmodellotest, 	idmodellotestvr, 
	 coalesce(titolo_,'Da definire'), coalesce(titolo_, 'Da definire'), 
	 coalesce(dataprevista, current_date),          datariferimento,  documentazionenecessaria,   
	 idcentrogest,   'P', datacompetenza::date );
	
	/************************************************************Monitoraggio del rischio di credito del cliente************************************************************/
	IF idargomento = 6723 THEN
	
		/* Per ogni cliente che ha un contratto aperto */
		i := 1;
		FOR Rec IN ( SELECT distinct id_cliente FROM entrasp.contratti WHERE codice_azienda=codiceazienda AND stato != 'C' ) LOOP
					
					/*Inserisco SOMMINISTRAZIONE*/
					INSERT INTO entrasp.sondaggi_somministrati 
					(codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione,  id_anagrafica,    
					 object_name, 					   object_key,		  													   object_description   ) 
					VALUES 
					( codiceazienda, 	  max_snd, 		    max_ss + i,    current_date, Rec.id_cliente,  
					 'anagraficheId', codicepart||'|'||Rec.id_cliente, ( select entrasp.anagrafiche_vr_dati_identificativi(codicepart, Rec.id_cliente) ) );
					
					i := i + 1;
					count_somministrazioni := count_somministrazioni + 1;
		END LOOP;
		
	/*************************************************************************Monitoraggio covenant*************************************************************************/
	ELSEIF idargomento = 6724 THEN 
		
	/* Per ogni somministrazione legata al modello di test "Delibera di approvazione" e per il quale alla
	   domanda "Specificare eventuali covenant deliberati" ci sia la risposta diversa da "NESSUN COVENANT" */
	    i := 1;
		FOR Rec IN ( select distinct ss.id_somministrazione, ss.id_contratto, coalesce(ss.id_anagrafica, (select id_cliente from entrasp.contratti where codice_azienda=codiceazienda and id_contratto=ss.id_contratto))::numeric as id_anagrafica, ss.id_sondaggio, snd.id_modello_test, snd.id_modello_test_vr
					from entrasp.sondaggi_somministrati ss 
					inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio 
					inner join entrasp.modelli_test mt on snd.codice_azienda=mt.codice_azienda and snd.id_modello_test=mt.id_modello_test
					inner join entrasp.risposte rs on rs.codice_azienda=ss.codice_azienda and rs.id_sondaggio=ss.id_sondaggio and rs.id_somministrazione=ss.id_somministrazione and rs.id_modello_test=snd.id_modello_test and rs.id_modello_test_vr=snd.id_modello_test_vr						
					inner join entrasp.risposte_previste rp on rp.codice_azienda=rs.codice_azienda and rs.id_modello_test=rp.id_modello_test and rs.id_modello_test_vr=rp.id_modello_test_vr and rs.id_domanda=rp.id_domanda and rp.id_risposta_prev=rs.id_risposta_prev
					inner join entrasp.domande dm on dm.codice_azienda=rp.codice_azienda and dm.id_modello_test=rp.id_modello_test and dm.id_modello_test_vr=rp.id_modello_test_vr and dm.id_domanda = rp.id_domanda
					where ss.codice_azienda=codiceazienda
					and mt.id_argomento=3507 and dm.id_argomento=11919 and rp.id_argomento not in (43525,2406)
					and ss.id_contratto is not null --MT: delibera di approvazione(3507) -> DM: Specifica covenant(1191) -> RP: Nessun covenant(43525)/Non applicabile(2406)
					and ss.id_contratto not in (select id_contratto from entrasp.contratti where codice_part=codicepart AND stato = 'C')							
					)
		LOOP
						/*Trovo quali covenant saranno da controllare*/
						SELECT array_agg(distinct b.id_argomento)
						FROM entrasp.risposte a 
						INNER JOIN entrasp.risposte_previste b ON a.codice_azienda=b.codice_azienda AND a.id_modello_test=b.id_modello_test AND a.id_modello_test_vr=b.id_modello_test_vr AND a.id_domanda=b.id_domanda AND a.id_risposta_prev=b.id_risposta_prev
						INNER JOIN entrasp.domande c ON b.codice_azienda=c.codice_azienda AND b.id_modello_test=c.id_modello_test AND b.id_modello_test_vr=c.id_modello_test_vr AND b.id_domanda = c.id_domanda
						WHERE a.codice_azienda=codiceazienda AND c.id_argomento=11919 AND a.id_modello_test=Rec.id_modello_test AND a.id_modello_test_vr=Rec.id_modello_test_vr and a.id_sondaggio=Rec.id_sondaggio and a.id_somministrazione=Rec.id_somministrazione
						INTO arg_risposte;
						
						/*Inserisco SOMMINISTRAZIONE*/
						INSERT INTO entrasp.sondaggi_somministrati 
						(codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione,    id_anagrafica,  object_name, 					       object_key,		  													  																											     object_description   ) 
						VALUES 
						( codiceazienda, 	  max_snd, 		   max_ss + i,    current_date, Rec.id_anagrafica,  'contratti', codiceazienda||'|'||Rec.id_contratto, (select numero_contratto||'-'||entrasp.anagrafiche_vr_dati_identificativi(codicepart, id_cliente) from entrasp.contratti where id_contratto=Rec.id_contratto and codice_azienda=codiceazienda) );
						
						SELECT id_domanda from entrasp.domande where codice_azienda=codiceazienda and id_argomento=43521 and id_modello_test=idmodellotest and id_modello_test_vr=idmodellotestvr INTO iddomanda; --43521 = Indicare i covenant al contratto formalizzati
						
						FOREACH risposta_ IN ARRAY arg_risposte LOOP
							SELECT coalesce(max(id_risposta),0)+1 from entrasp.risposte where codice_azienda=codiceazienda INTO max_idrisposta;
							
							INSERT INTO entrasp.risposte (codice_azienda, id_modello_test, id_modello_test_vr, id_sondaggio, id_somministrazione, id_domanda, id_risposta_prev,    id_risposta, risposta, punteggio, peso) 
							SELECT 						   codiceazienda,   idmodellotest,    idmodellotestvr,      max_snd,	      max_ss + i,  iddomanda, id_risposta_prev, max_idrisposta, risposta,		  0,    0
							FROM entrasp.risposte_previste 
							WHERE codice_azienda=codiceazienda AND id_argomento=risposta_ AND id_domanda=iddomanda AND id_modello_test=idmodellotest AND id_modello_test_vr=idmodellotestvr;

						END LOOP;
						
						--DEPRECATED:  SELECT entrasp.sondaggio_somministrato_insert(codiceazienda, max_snd, '', Rec.id_anagrafica, 'contratti', codiceazienda||'|'||Rec.id_contratto, CURRENT_DATE, Rec.id_contratto, arg_risposte);
						i := i + 1;
						count_somministrazioni := count_somministrazioni + 1;
		END LOOP;		
	
	/*****************************************************************Monitoraggio perfezionamento garanzie******************************************************************/
	ELSIF idargomento = 6725 THEN 

	/*  Per ogni somministrazione legata al modello di test "Delibera di approvazione" e per il quale alla domanda "Approvazione" ci sia la risposta "Deliberato con garanzie" e											
	    dove non esista già una profilazione "Monitoraggio garanzie" legata alla somministrazione in quesitone per il quale alla domanda 
		"Le garanzie deliberate dal CdA sono state perfezionate?" ci sia la risposta "Sì" */
		i := 1;
		FOR Rec IN ( select distinct ss.id_somministrazione, ss.id_contratto, coalesce(ss.id_anagrafica, (select id_cliente from entrasp.contratti where codice_azienda=codiceazienda and id_contratto=ss.id_contratto))::numeric as id_anagrafica, ss.id_sondaggio, snd.id_modello_test, snd.id_modello_test_vr
					from entrasp.sondaggi_somministrati ss 
					inner join entrasp.sondaggi snd on ss.codice_azienda=snd.codice_azienda and ss.id_sondaggio=snd.id_sondaggio 
					inner join entrasp.modelli_test mt on snd.codice_azienda=mt.codice_azienda and snd.id_modello_test=mt.id_modello_test
					inner join entrasp.risposte rs on rs.codice_azienda=ss.codice_azienda and rs.id_sondaggio=ss.id_sondaggio and rs.id_somministrazione=ss.id_somministrazione and rs.id_modello_test=snd.id_modello_test and rs.id_modello_test_vr=snd.id_modello_test_vr						
					inner join entrasp.risposte_previste rp on rp.codice_azienda=rs.codice_azienda and rs.id_modello_test=rp.id_modello_test and rs.id_modello_test_vr=rp.id_modello_test_vr and rs.id_domanda=rp.id_domanda and rp.id_risposta_prev=rs.id_risposta_prev
					inner join entrasp.domande dm on dm.codice_azienda=rp.codice_azienda and dm.id_modello_test=rp.id_modello_test and dm.id_modello_test_vr=rp.id_modello_test_vr and dm.id_domanda = rp.id_domanda
					where ss.codice_azienda=codiceazienda
					and mt.id_argomento=3507 and dm.id_argomento in (6763,41641) and rp.id_argomento = 1382
					and ss.id_contratto is not null--MT: delibera di approvazione(3507) -> DM: Approvazione(6763) -> RP: Deliberato con garanzie(1382)
					and codiceazienda||'|'||ss.id_contratto not in (SELECT a.object_key 
																	FROM entrasp.sondaggi_somministrati a 
																	inner join entrasp.sondaggi b on a.codice_azienda=b.codice_azienda and a.id_sondaggio=b.id_sondaggio 
																	inner join entrasp.modelli_test c on b.codice_azienda=c.codice_azienda and b.id_modello_test=c.id_modello_test 
																	inner join entrasp.risposte d on d.codice_azienda=a.codice_azienda and d.id_sondaggio=a.id_sondaggio and d.id_somministrazione=a.id_somministrazione and d.id_modello_test=b.id_modello_test and d.id_modello_test_vr=b.id_modello_test_vr 
																	inner join entrasp.risposte_previste e on d.codice_azienda=e.codice_azienda and d.id_modello_test=e.id_modello_test and d.id_modello_test_vr=e.id_modello_test_vr and d.id_domanda=e.id_domanda and d.id_risposta_prev=e.id_risposta_prev
																	inner join entrasp.domande f on f.codice_azienda=e.codice_azienda and f.id_modello_test=e.id_modello_test and f.id_modello_test_vr=e.id_modello_test_vr and f.id_domanda = e.id_domanda
																	WHERE a.codice_azienda=codiceazienda --and a.object_name='contratti' and a.id_contratto=ss.id_contratto --and mt.id_filtro_selezione=64 
																	and c.id_argomento=6725 and f.id_argomento=6764 and e.id_argomento=6765) --non esiste una profilazione di monitoraggio garanzie con risposta SI alla domanda sul perfezionamento garanzie
					and ss.id_contratto not in (select id_contratto from entrasp.contratti where codice_azienda=codiceazienda AND stato = 'C')
					) 

		LOOP
						/*Trovo quali garanzie saranno da controllare*/
						SELECT array_agg(distinct b.id_argomento)
						FROM entrasp.risposte a 
						INNER JOIN entrasp.risposte_previste b ON a.codice_azienda=b.codice_azienda AND a.id_modello_test=b.id_modello_test AND a.id_modello_test_vr=b.id_modello_test_vr AND a.id_domanda=b.id_domanda AND a.id_risposta_prev=b.id_risposta_prev
						INNER JOIN entrasp.domande c ON b.codice_azienda=c.codice_azienda AND b.id_modello_test=c.id_modello_test AND b.id_modello_test_vr=c.id_modello_test_vr AND b.id_domanda = c.id_domanda
						WHERE a.codice_azienda=codiceazienda AND c.id_argomento=6827 AND a.id_modello_test=Rec.id_modello_test AND a.id_modello_test_vr=Rec.id_modello_test_vr and a.id_sondaggio=Rec.id_sondaggio and a.id_somministrazione=Rec.id_somministrazione
						INTO arg_risposte;
						
						/*Inserisco SOMMINISTRAZIONE*/
						INSERT INTO entrasp.sondaggi_somministrati 
						(codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione,     id_anagrafica,  object_name, 					       object_key,		  													  																												   object_description   ) 
						VALUES 
						( codiceazienda, 	  max_snd, 		    max_ss + i,    current_date, Rec.id_anagrafica,  'contratti', codiceazienda||'|'||Rec.id_contratto, (select numero_contratto||'-'||entrasp.anagrafiche_vr_dati_identificativi(codicepart, id_cliente) from entrasp.contratti where id_contratto=Rec.id_contratto and codice_azienda=codiceazienda) );
						
						SELECT id_domanda from entrasp.domande where codice_azienda=codiceazienda and id_argomento=6828 and id_modello_test=idmodellotest and id_modello_test_vr=idmodellotestvr INTO iddomanda; --6828=indicare la garanzia deliberata dall'organo preposto
						
						FOREACH risposta_ IN ARRAY arg_risposte LOOP
							SELECT coalesce(max(id_risposta),0)+1 from entrasp.risposte where codice_azienda=codiceazienda INTO max_idrisposta;
							
							INSERT INTO entrasp.risposte (codice_azienda, id_modello_test, id_modello_test_vr, id_sondaggio, id_somministrazione, id_domanda, id_risposta_prev,    id_risposta, risposta, punteggio, peso) 
							SELECT 						   codiceazienda,   idmodellotest,    idmodellotestvr,      max_snd,	      max_ss + i,  iddomanda, id_risposta_prev, max_idrisposta, risposta,		  0,    0
							FROM entrasp.risposte_previste 
							WHERE codice_azienda=codiceazienda AND id_argomento=risposta_ AND id_domanda=iddomanda AND id_modello_test=idmodellotest AND id_modello_test_vr=idmodellotestvr;

						END LOOP;
						
						--DEPRECATED:  SELECT entrasp.sondaggio_somministrato_insert(codiceazienda, max_snd, '', Rec.id_anagrafica, 'contratti', codiceazienda||'|'||Rec.id_contratto, CURRENT_DATE, Rec.id_contratto, arg_risposte);
						i := i + 1;
						count_somministrazioni := count_somministrazioni + 1;
		END LOOP;
			
	/**********************************************************Dichiarazione assenza operazioni in restricted list**********************************************************/
	ELSEIF idargomento = 43561 THEN 
		
	/* Per ogni anagrafica che ha un ruolo rilevante (SR) */
	    i := 1;
		FOR Rec IN ( SELECT DISTINCT id_anagrafica from entrasp.ruoli_anagrafiche where codice_part=codicepart and codice_ruolo = 'SR' )
		LOOP						
			/*Inserisco SOMMINISTRAZIONE*/
			INSERT INTO entrasp.sondaggi_somministrati 
			(codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione,    id_anagrafica,      object_name, 			              object_key, 		   											           object_description   ) 
			VALUES 
			( codiceazienda, 	  max_snd, 		    max_ss + i,    current_date, Rec.id_anagrafica,  'anagraficheId', codicepart||'|'||Rec.id_anagrafica, (select entrasp.anagrafiche_vr_dati_identificativi(codicepart, Rec.id_anagrafica)));
						
			i := i + 1;
			count_somministrazioni := count_somministrazioni + 1;
		END LOOP;	
	
	/**********************************************************Dichiarazione assenza operazioni in restricted list**********************************************************/
	ELSEIF idargomento = 301 THEN 
		
	/* Per ogni trattamento dati */
	  
		update entrasp.cpl_trattamenti_dati
		set titolo=coalesce(titolo, descrizione)
		where titolo is null and codice_azienda=codiceazienda;
		
		INSERT INTO entrasp.sondaggi_somministrati 
			(codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, 
			 object_name, object_key, object_description) 
		select distinct td.codice_azienda, max_snd, max_ss+ (row_number() over (order by td.id_trattamento_dati)), current_date, 
		'cplTrattamentiDati', td.codice_azienda||'|'||td.id_trattamento_dati, td.titolo
		from entrasp.cpl_trattamenti_dati td 
		where td.codice_azienda=codiceazienda
		on conflict do nothing;
		
		count_somministrazioni:=1;

	/**********************************************************Dichiarazione assenza operazioni in restricted list**********************************************************/
	ELSEIF idargomento = 43567 THEN 
		
	/* Per ogni anagrafica che appartiene ad un centro gestionale relativo ad esponenti aziendali (COllegio sindacale 1223 o Consiglio di amministrazione 3356)*/
	   	INSERT INTO entrasp.sondaggi_somministrati 
			(codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, object_name, object_key, object_description) 
		select distinct codiceazienda, max_snd, max_ss+ (row_number() over (order by cg.id_centro_gest)), current_date, 'anagraficheId', cg.codice_part||'|'||glm.id_anagrafica, entrasp.anagrafiche_vr_dati_identificativi(cg.codice_part, glm.id_anagrafica)
		from entrasp.gruppi_lavoro_membri glm 
		inner join entrasp.centri_gestionali cg on glm.codice_part=cg.codice_part and glm.id_gruppo_lavoro=cg.id_gruppo_lavoro
		where glm.codice_part=codicepart
		and cg.id_argomento in(3356, 1223)
		on conflict do nothing;
		
		count_somministrazioni:=1;
	
    /************************************************************Check List per Valutazione Fornitori (LACOPLAST)************************************************************/
	ELSEIF idargomento = 45083 THEN
	
		/* Per ogni fornitore che ha un contratto aperto */
		i := 1;
		FOR Rec IN (SELECT distinct AN.id_anagrafica
                    FROM entrasp.anagrafiche_id an 
                    INNER JOIN entrasp.ruoli_anagrafiche ra ON an.codice_part=ra.codice_part AND an.id_anagrafica=ra.id_anagrafica
                    LEFT JOIN entrasp.contratti ctr ON ctr.codice_part=ra.codice_part AND ctr.id_cliente=ra.id_anagrafica 
                    WHERE an.codice_part=codicepart
                    and ra.codice_ruolo = 'FOR'
                    AND (ctr.stato != 'C'  OR ctr.stato IS NULL) ) LOOP
					
					/*Inserisco SOMMINISTRAZIONE*/
					INSERT INTO entrasp.sondaggi_somministrati 
					(codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione,  id_anagrafica,     object_name, 					   object_key,		  													   object_description   ) 
					VALUES 
					( codiceazienda, 	  max_snd, 		    max_ss + i,    current_date, Rec.id_anagrafica,  'anagraficheId', codicepart||'|'||Rec.id_anagrafica, ( select entrasp.anagrafiche_vr_dati_identificativi(codicepart, Rec.id_anagrafica) ) );
					
					i := i + 1;
					count_somministrazioni := count_somministrazioni + 1;
		END LOOP;
	
	 /***************************************************Check List per controllare con OneKYC i contratti attivi**************************************************/
	ELSEIF idargomento = 45421 THEN
	
		/* Per ogni contratto attivo riferito ad una anagrafica */
		i := 1;
		FOR Rec IN (SELECT distinct an.id_anagrafica
                    FROM entrasp.anagrafiche_id an 
                    INNER JOIN entrasp.contratti ctr ON ctr.codice_part=an.codice_part AND ctr.id_cliente=an.id_anagrafica 
                    WHERE an.codice_part=codicepart
                    AND (ctr.stato != 'C'  OR ctr.stato IS NULL) ) LOOP
					
					/*Inserisco SOMMINISTRAZIONE*/
					INSERT INTO entrasp.sondaggi_somministrati 
					(codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione,  id_anagrafica,     object_name, 					   object_key,		  													   object_description   ) 
					VALUES 
					( codiceazienda, 	  max_snd, 		    max_ss + i,    current_date, Rec.id_anagrafica,  'anagraficheId', codicepart||'|'||Rec.id_anagrafica, ( select entrasp.anagrafiche_vr_dati_identificativi(codicepart, Rec.id_anagrafica) ) );
					
					i := i + 1;
					count_somministrazioni := count_somministrazioni + 1;
		END LOOP;
		

	/******************************************************************************Insert base*******************************************************************************/
 /***************************************************Check List per controllare i contratti attivi associati alla fatturazione trimestrale ***********************************/
	ELSEIF idargomento = 45764 THEN
	
	-- cancello eventuali somministrazioni non già compilate che eventualmente sono state spostate in altra scadenza.				
					
		delete from entrasp.sondaggi_somministrati ss
		where  ss.codice_azienda=codiceazienda and id_sondaggio=max_snd
		and ss.object_key not in(select cnt.codice_azienda||'|'||cnt.id_contratto
							   FROM entrasp.contratti cnt  	
         					   WHERE cnt.codice_azienda=codiceazienda and id_argomento_evento=idargomentoevento
                    			AND (cnt.stato != 'C'  OR cnt.stato IS NULL))
		and stato !='C' 
		and codice_azienda||'-'||id_sondaggio||'-'||id_somministrazione not in
		(
			select codice_azienda||'-'||id_sondaggio||'-'||id_somministrazione
			from entrasp.risposte where codice_azienda=codiceazienda and id_sondaggio=max_snd
		);
					
	-- inserisco somministrazioni non già presenti in quella scadenza
		INSERT INTO entrasp.sondaggi_somministrati 
					(codice_azienda, id_sondaggio, id_somministrazione, 
					 data_esecuzione, object_name, 					   
					 object_key,		  													      
					 object_description) 
		select
				cnt.codice_azienda,  max_snd, 	max_ss + row_number() over(order by cnt.id_contratto),    
				current_date, 'contratti', 
				cnt.codice_azienda||'|'||cnt.id_contratto, 
				entrasp.anagrafiche_vr_dati_identificativi(codicepart, cnt.id_cliente)||'-cnt'||cnt.id_contratto
		FROM entrasp.contratti cnt  	
        WHERE cnt.codice_azienda=codiceazienda and id_argomento_evento=idargomentoevento
                    AND (cnt.stato != 'C'  OR cnt.stato IS NULL)
				and cnt.codice_azienda||'|'||cnt.id_contratto not in 
				(
					select object_key
					from entrasp.sondaggi_somministrati 
				 	where codice_azienda=codiceazienda and id_sondaggio=max_snd
				);
					

	/******************************************************************************Insert base*******************************************************************************/

	ELSE	
	
		SELECT id_anagrafica FROM entrasp.aziende WHERE codice_azienda=codiceazienda INTO id_anagrafica_societa;
		
		PERFORM entrasp.sondaggio_somministrato_insert(codiceazienda, max_snd, '', id_anagrafica_societa, 'anagraficheId', codicepart||'|'||id_anagrafica_societa, current_date);
		
		count_somministrazioni := count_somministrazioni + 1;
		
	END IF;
	
	/******************************************************************Se non sono state inserite verifiche*******************************************************************/
	IF (count_somministrazioni = 0) THEN
				
		SELECT id_anagrafica FROM entrasp.aziende WHERE codice_azienda=codiceazienda INTO id_anagrafica_societa;
		
		PERFORM entrasp.sondaggio_somministrato_insert(codiceazienda, max_snd, '', id_anagrafica_societa, 'anagraficheId', codicepart||'|'||id_anagrafica_societa, current_date);
		
	END IF;
	
	RETURN max_snd;
	
END
$BODY$;

ALTER FUNCTION entrasp.crea_sondaggio_multiplo(character varying, numeric, date, date, character varying, numeric)
    OWNER TO postgres;

-- FUNCTION: entrasp.grc_accoda_singolo_sondaggio_stessa_azienda(text, numeric, boolean, numeric, interval, integer, boolean)

-- DROP FUNCTION IF EXISTS entrasp.grc_accoda_singolo_sondaggio_stessa_azienda(text, numeric, boolean, numeric, interval, integer, boolean);

CREATE OR REPLACE FUNCTION entrasp.grc_accoda_singolo_sondaggio_stessa_azienda(
	codiceazienda text,
	idsondaggio numeric,
	insert_allegati boolean DEFAULT false,
	idprogetto numeric DEFAULT NULL::numeric,
	interval_value interval DEFAULT NULL::interval,
	interval_multiplier integer DEFAULT NULL::integer,
	conrisposte boolean DEFAULT true)
    RETURNS TABLE(idnew numeric) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
 
declare max_somministrazione integer; max_sondaggio integer; nomeseq varchar(200); tempo integer; Rec record; Rec1 record; Rec2 record;
idmodellotest numeric; idmodellotestvr numeric; idmodellotestvr_new numeric; 
max_id_risposta integer; max_id_risorsa numeric; conta_sondaggi numeric;
conta_somministazioni numeric; idsondaggio_ numeric; max_prog_revisione numeric; 
idsomministrazione_ numeric; idprogetto_ varchar;

begin
select max(id_sondaggio) as massimo2 from entrasp.sondaggi where codice_azienda= $1 into max_sondaggio;
select max(id_somministrazione) as massimo2 from entrasp.sondaggi_somministrati where codice_azienda= $1 into max_somministrazione;
select max(id_risposta) from entrasp.risposte where codice_azienda= $1 into max_id_risposta;

nomeseq:='entrasp.id_somministrazione';
perform setval(nomeseq, max_somministrazione);
nomeseq:='entrasp.id_risposta';
perform setval(nomeseq, max_id_risposta);

select id_modello_test, id_modello_test_vr 
from entrasp.sondaggi 
where codice_azienda=codiceazienda and id_sondaggio=idsondaggio into idmodellotest, idmodellotestvr;

select max(id_modello_test_vr) 
from entrasp.modelli_test_vr 
where codice_azienda=codiceazienda and id_modello_test=idmodellotest into idmodellotestvr_new;

INSERT INTO entrasp.sondaggi (codice_azienda, id_sondaggio, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, 
							  id_modello_test, object_key, stato, data_prevista, data_esecuzione, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, id_contratto,
							  data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a,  titolo, id_serie, 
							  selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati) 
SELECT $1,max_sondaggio+1, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, 
idmodellotest, object_key, 'P', coalesce(data_prevista+interval_value*interval_multiplier, current_date), null::date, 
id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica,  id_contratto,
coalesce(data_comp+interval_value*interval_multiplier, current_date), idmodellotestvr_new, data_riferimento_da, data_riferimento_a, left('XXXX'||coalesce(titolo,'')||'XXXX', 240), id_serie, 
'XXXX'||coalesce(selezione_campione,'')||'XXXX', 'XXXX'||coalesce(documentazione_analizzata,'')||'XXXX', 'XXXX'||coalesce(metodologia_presentazione_risultati,'')||'XXXX'
from entrasp.sondaggi
where codice_azienda=$1 and id_sondaggio=$2;

INSERT INTO entrasp.sondaggi_somministrati (codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, 
											id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, 
											note, pct_da, pct_da_manuale, id_modello_test_vr, id_somministrazione_prec) 
SELECT $1,max_sondaggio+1, nextval('entrasp.id_somministrazione'), current_date, ss.id_anagrafica, ss.object_name, ss.object_key, 
idmodellotest, ss.id_sottomodello, ss.object_description, ss.punteggio_massimo, ss.punteggio_ottenuto, 'P', ss.id_risultato, 
'XXXX'||coalesce(ss.note,'')||'XXXX', ss.pct_da, ss.pct_da_manuale, idmodellotestvr_new, ss.id_somministrazione
from entrasp.sondaggi_somministrati ss
where codice_azienda=$1 and id_sondaggio=$2;

--INSERT INTO entrasp.sondaggi_somministrati_oggetti_considerati(codice_azienda, id_sondaggio, id_somministrazione, object_name, object_key, object_description) 
--SELECT $1,max_sondaggio+1,max_somministrazione+1 , object_name, object_key, object_description
--from entrasp.sondaggi_somministrati_oggetti_considerati
--where codice_azienda=$1 and id_sondaggio=$2;

--raise notice 'ca: %', codiceazienda; 
--raise notice 'idmdt: %', idmodellotest; 
--raise notice 'idmdt: %', idmodellotestvr;

if conrisposte then

	INSERT INTO entrasp.risposte(codice_azienda, id_modello_test, id_risposta, risposta, id_domanda, id_risposta_prev, object_name, object_key, id_sondaggio, 
								 id_somministrazione, 
								 punteggio, peso, note, id_modello_test_vr, punteggio_risposta) 
	SELECT $1, idmodellotest, nextval('entrasp.id_risposta'), rp.risposta, rp.id_domanda, rp.id_risposta_prev, rp.object_name, rp.object_key, max_sondaggio+1, 
	(select ss2.id_somministrazione from entrasp.sondaggi_somministrati ss2 
	 where ss2.codice_azienda=codiceazienda and ss2.id_sondaggio=max_sondaggio+1 and ss2.object_key=ss.object_key limit 1), 
	 rp.punteggio, rp.peso, 'XXXX'||coalesce(rp.note,'')||'XXXX', idmodellotestvr_new, rp.punteggio_risposta 
	from entrasp.risposte rp inner join entrasp.sondaggi_somministrati ss on rp.codice_azienda=ss.codice_azienda and rp.id_somministrazione=ss.id_somministrazione
	where ss.codice_azienda=$1 AND ss.id_sondaggio=idsondaggio
	and rp.codice_azienda||'-'||rp.id_modello_test||'-'||rp.id_domanda||'-'||rp.id_risposta_prev in (
			select rprev.codice_azienda||'-'||rprev.id_modello_test||'-'||rprev.id_domanda||'-'||rprev.id_risposta_prev
			from entrasp.risposte_previste rprev
			where rprev.codice_azienda=codiceazienda and rprev.id_modello_test=idmodellotest 
			and rprev.id_modello_test_vr=idmodellotestvr_new and rprev.id_risposta_prev is not null
								);
end if;
--id_sondaggio_new
idsondaggio_ := max_sondaggio+1;

--INSERT REVISIONI (da somministrazioni) -- Per ogni documento di ogni somministrazione originale
--Davide added last inner join to check if risorsa existed
FOR Rec in(SELECT DISTINCT a.id_somministrazione,a.object_key,b.id_risorsa,b.prog_revisione 
		   from entrasp.sondaggi_somministrati a 
		   inner join  entrasp.cdms_risorse_oggetti b on a.codice_azienda=b.codice_azienda and a.id_sondaggio=b.id_sondaggio and a.id_somministrazione=b.id_somministrazione
		   inner join entrasp.cdms_risorse_revisioni c on b.codice_azienda=c.codice_azienda and b.id_risorsa=c.id_risorsa and b.prog_revisione=c.prog_revisione
		   INNER JOIN entrasp.cdms_risorse ris ON ris.codice_azienda=c.codice_azienda AND ris.id_risorsa=c.id_risorsa
		   where a.codice_azienda=$1 and a.id_sondaggio=$2 and b.nome_business_object='sondaggiSomministrati') LOOP

	select max(prog_revisione)+1 from entrasp.cdms_risorse_revisioni where codice_azienda=$1 and id_risorsa=Rec.id_risorsa into max_prog_revisione;
	
	/*raise notice 'ciclo 1 %', Rec.id_somministrazione;
	raise notice 'SND%', $2;
	raise notice 'rsr%', Rec.id_risorsa;
	raise notice 'pvr%', max_prog_revisione;*/
	
	INSERT INTO entrasp.cdms_risorse_revisioni(codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, client_file_name, content_type, descrizione, data_rif, revisore, id_argomento_stato)
	select $1, Rec.id_risorsa, max_prog_revisione, current_date,
	( select (coalesce((select max(rev.file_id)::numeric from entrasp.cdms_risorse_revisioni rev where file_id ~ '^[0-9\.]+$'),0))::numeric 
 	+ ROW_NUMBER() OVER(order by id_risorsa) from entrasp.cdms_risorse_revisioni order by id_risorsa desc limit 1)::varchar,
	'tbd','tbd', 'XXX'||a.descrizione||'XXX', coalesce(a.data_rif + interval_value*interval_multiplier, a.data_rif+'1 year'), a.revisore, 6150  --6150=DA DEFINIRE
	from entrasp.cdms_risorse_revisioni a inner join entrasp.cdms_risorse_oggetti b on a.codice_azienda=b.codice_azienda and a.id_risorsa=b.id_risorsa and a.prog_revisione=b.prog_revisione
	where a.id_risorsa=Rec.id_risorsa and b.codice_azienda=$1 and b.id_sondaggio=$2 and b.id_somministrazione=Rec.id_somministrazione and a.prog_revisione=Rec.prog_revisione 
	group by a.id_risorsa,a.descrizione,a.data_rif,a.revisore; 	
					 
	select ss.id_somministrazione from entrasp.sondaggi_somministrati ss where ss.codice_azienda=$1 and ss.id_sondaggio=idsondaggio_ /*max_sondaggio+1*/ and ss.object_key=Rec.object_key limit 1 into idsomministrazione_;
	
	INSERT INTO entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave, id_sondaggio, id_somministrazione, id_modello_test, id_modello_test_vr, id_progetto, oggetto_cancellato, da_classificare)
	SELECT DISTINCT $1, Rec.id_risorsa, max_prog_revisione, nome_business_object, codiceazienda||'^'||idsondaggio_::varchar||'^'||idsomministrazione_::varchar, idsondaggio_, idsomministrazione_ , idmodellotest , idmodellotestvr_new, idprogetto, false, false
	from entrasp.cdms_risorse_oggetti where codice_azienda=$1 and id_sondaggio=$2 and id_somministrazione=Rec.id_somministrazione AND nome_business_object != 'sondaggi';
	
	PERFORM entrasp.calcola_id_argomento_stato($1, Rec.id_risorsa, true);
	
END LOOP;

--SE SOLO SU SONDAGGIO(ovvero doc con flag_applicazione_singola a '1')
FOR Rec2 in(SELECT distinct a.codice_azienda,a.id_risorsa,a.prog_revisione,b.descrizione,b.data_rif,b.revisore 
			from entrasp.cdms_risorse_oggetti a inner join entrasp.cdms_risorse_revisioni b on a.codice_azienda=b.codice_azienda and a.id_risorsa=b.id_risorsa and a.prog_revisione=b.prog_revisione 
			inner join entrasp.cdms_risorse c on b.id_risorsa=c.id_risorsa and b.codice_azienda=c.codice_azienda
			where a.codice_azienda=$1 and a.id_sondaggio=$2 and nome_business_object = 'sondaggi'
			and c.id_argomento_tipo_allegato in (select id_argomento_documento 
												 from entrasp.modelli_test_argomenti_documenti 
												 where codice_azienda=$1
												 and id_modello_test=(select id_modello_test from entrasp.sondaggi where codice_azienda=$1 and id_sondaggio=$2)
												 and flag_applicazione_singola='1'
												)
			) LOOP

	select max(prog_revisione)+1 from entrasp.cdms_risorse_revisioni where codice_azienda=$1 and id_risorsa=Rec2.id_risorsa into max_prog_revisione;

--	raise notice 'ciclo 2';
--	raise notice 'SND%', $2;
--	raise notice 'rsr%', Rec2.id_risorsa;
--	raise notice 'pvr%', max_prog_revisione;

	INSERT INTO entrasp.cdms_risorse_revisioni(codice_azienda, id_risorsa, prog_revisione, data_creazione, file_id, client_file_name, content_type, descrizione, data_rif, revisore, id_argomento_stato)
	select $1, Rec2.id_risorsa, max_prog_revisione, current_date,
	( select (coalesce((select max(rev.file_id)::numeric from entrasp.cdms_risorse_revisioni rev where file_id ~ '^[0-9\.]+$'),0))::numeric 
	+ ROW_NUMBER() OVER(order by id_risorsa) from entrasp.cdms_risorse_revisioni order by id_risorsa desc limit 1)::varchar,
	'tbd','tbd', 'XXX'||Rec2.descrizione||'XXX', Rec2.data_rif + interval '1 year', Rec2.revisore, 6150;  --6150=DA DEFINIRE

	INSERT INTO entrasp.cdms_risorse_oggetti (codice_azienda, id_risorsa, prog_revisione, nome_business_object, chiave, id_sondaggio, id_modello_test, id_modello_test_vr, id_progetto, oggetto_cancellato, da_classificare)
	SELECT DISTINCT $1, id_risorsa, max_prog_revisione, nome_business_object, codiceazienda||'^'||idsondaggio_::varchar, idsondaggio_, idmodellotest , idmodellotestvr_new,idprogetto,  false, false
	from entrasp.cdms_risorse_oggetti where codice_azienda=$1 and id_risorsa=Rec2.id_risorsa and prog_revisione=Rec2.prog_revisione;

	PERFORM entrasp.calcola_id_argomento_stato($1, Rec2.id_risorsa, true);

END LOOP;
--END IF;

return query select id_sondaggio from entrasp.sondaggi where id_sondaggio=max_sondaggio+1  and codice_azienda=codiceazienda;

end
 
$BODY$;

ALTER FUNCTION entrasp.grc_accoda_singolo_sondaggio_stessa_azienda(text, numeric, boolean, numeric, interval, integer, boolean)
    OWNER TO postgres;

-- FUNCTION: entrasp.grc_accoda_sondaggiecollegati(text, text)

-- DROP FUNCTION IF EXISTS entrasp.grc_accoda_sondaggiecollegati(text, text);

CREATE OR REPLACE FUNCTION entrasp.grc_accoda_sondaggiecollegati(
	"AziendaSorgente" text,
	"AziendaDestinataria" text)
    RETURNS void
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$

INSERT INTO entrasp.sondaggi (codice_azienda, id_sondaggio, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, id_modello_test, object_key, stato, data_prevista, data_esecuzione, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati) 
SELECT $2,entrasp.grc_sondaggio_piu_1($2), descrizione, data_rilevazione_da, data_rilevazione_a, object_name, entrasp.grc_id_mdt($1,$2,id_modello_test,id_modello_test_vr), object_key, stato, data_prevista, data_esecuzione, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati
from entrasp.sondaggi
where codice_azienda=$1;

INSERT INTO entrasp.sondaggi_somministrati (codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato,  id_sondaggio_succ, id_somministrazione_succ, note, pct_da, pct_da_manuale, id_modello_test_vr) 
SELECT $2,entrasp.grc_id_sondaggio($1,$2,id_sondaggio), id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, entrasp.grc_id_mdt($1,$2,id_modello_test,id_modello_test_vr), id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, id_sondaggio_succ, id_somministrazione_succ, note, pct_da, pct_da_manuale, id_modello_test_vr
from entrasp.sondaggi_somministrati
where codice_azienda=$1;

INSERT INTO entrasp.risposte(codice_azienda, id_modello_test, id_risposta, risposta, id_domanda, id_risposta_prev, object_name, object_key, id_sondaggio, id_somministrazione, punteggio, peso, note, id_modello_test_vr, punteggio_risposta) 
SELECT $2, entrasp.grc_id_mdt($1,$2,id_modello_test, id_modello_test_vr), id_risposta, risposta,entrasp.grc_id_domanda($1,$2,id_domanda,id_modello_test, id_modello_test_vr), entrasp.grc_id_risposta_prev($1,$2,id_risposta_prev,id_modello_test, id_modello_test_vr, id_domanda) , object_name, object_key, entrasp.grc_id_sondaggio($1,$2,id_sondaggio), entrasp.grc_id_somministrazione($1,$2,id_somministrazione), punteggio, peso, note, id_modello_test_vr, punteggio_risposta 
from entrasp.risposte
where codice_azienda=$1 AND
entrasp.grc_id_domanda($1,$2,id_domanda, id_modello_test, id_modello_test_vr) is not null;

$BODY$;

ALTER FUNCTION entrasp.grc_accoda_sondaggiecollegati(text, text)
    OWNER TO postgres;
-- FUNCTION: entrasp.grc_accoda_singolo_sondaggio(text, numeric, text)

-- DROP FUNCTION IF EXISTS entrasp.grc_accoda_singolo_sondaggio(text, numeric, text);

CREATE OR REPLACE FUNCTION entrasp.grc_accoda_singolo_sondaggio(
	"AziendaSorgente" text,
	"IdSondaggio" numeric,
	"AziendaDestinataria" text)
    RETURNS void
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
INSERT INTO entrasp.sondaggi (codice_azienda, id_sondaggio, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, id_modello_test, object_key, stato, data_prevista, data_esecuzione, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati) 
SELECT $3,entrasp.grc_sondaggio_piu_1($3), descrizione, data_rilevazione_da, data_rilevazione_a, object_name, entrasp.grc_id_mdt($1,$3,id_modello_test,id_modello_test_vr), object_key, stato, data_prevista, data_esecuzione, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati
from entrasp.sondaggi
where codice_azienda=$1 and id_sondaggio=$2;

INSERT INTO entrasp.sondaggi_somministrati (codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, note, pct_da, pct_da_manuale, id_modello_test_vr) 
SELECT $3,entrasp.grc_id_sondaggio($1,$3,id_sondaggio), entrasp.grc_somministrazione_piu_1($1), data_esecuzione, id_anagrafica, object_name, object_key, entrasp.grc_id_mdt($1,$3,id_modello_test,id_modello_test_vr), id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, note, pct_da, pct_da_manuale, id_modello_test_vr
from entrasp.sondaggi_somministrati
where codice_azienda=$1 and id_sondaggio=$2;

/*INSERT INTO entrasp.sondaggi_somministrati_oggetti_considerati(codice_azienda, id_sondaggio, id_somministrazione, object_name, object_key, object_description) 
SELECT $3,entrasp.grc_id_sondaggio($1,$3,id_sondaggio), entrasp.grc_id_somministrazione($1,$3,id_somministrazione), object_name, object_key, object_description
from entrasp.sondaggi_somministrati_oggetti_considerati
where codice_azienda=$1 and id_sondaggio=$2;*/

INSERT INTO entrasp.risposte(codice_azienda, id_modello_test, id_risposta, risposta, id_domanda, id_risposta_prev, object_name, object_key, id_sondaggio, id_somministrazione, punteggio, peso, note, id_modello_test_vr, punteggio_risposta) 
SELECT $3, entrasp.grc_id_mdt($1,$3,id_modello_test, id_modello_test_vr), id_risposta, risposta,entrasp.grc_id_domanda($1,$3,id_domanda,id_modello_test, id_modello_test_vr), entrasp.grc_id_risposta_prev($1,$3,id_risposta_prev,id_modello_test, id_modello_test_vr, id_domanda) , object_name, object_key, entrasp.grc_id_sondaggio($1,$3,id_sondaggio), entrasp.grc_id_somministrazione($1,$3,id_somministrazione), punteggio, peso, note, id_modello_test_vr, punteggio_risposta 
from entrasp.risposte
where codice_azienda=$1 AND
entrasp.grc_id_domanda($1,$3,id_domanda, id_modello_test, id_modello_test_vr) is not null and id_sondaggio=$2;

$BODY$;

ALTER FUNCTION entrasp.grc_accoda_singolo_sondaggio(text, numeric, text)
    OWNER TO postgres;

-- FUNCTION: entrasp.grc_accoda_singolo_sondaggio(text, numeric, text)

-- DROP FUNCTION IF EXISTS entrasp.grc_accoda_singolo_sondaggio(text, numeric, text);

CREATE OR REPLACE FUNCTION entrasp.grc_accoda_singolo_sondaggio(
	"AziendaSorgente" text,
	"IdSondaggio" numeric,
	"AziendaDestinataria" text)
    RETURNS void
    LANGUAGE 'sql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
INSERT INTO entrasp.sondaggi (codice_azienda, id_sondaggio, descrizione, data_rilevazione_da, data_rilevazione_a, object_name, id_modello_test, object_key, stato, data_prevista, data_esecuzione, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati) 
SELECT $3,entrasp.grc_sondaggio_piu_1($3), descrizione, data_rilevazione_da, data_rilevazione_a, object_name, entrasp.grc_id_mdt($1,$3,id_modello_test,id_modello_test_vr), object_key, stato, data_prevista, data_esecuzione, id_gruppo_lavoro, id_centro_gest, flag_utenti, id_anagrafica, data_comp, id_modello_test_vr, data_riferimento_da, data_riferimento_a, id_somministrazione, titolo, id_serie, selezione_campione, documentazione_analizzata, metodologia_presentazione_risultati
from entrasp.sondaggi
where codice_azienda=$1 and id_sondaggio=$2;

INSERT INTO entrasp.sondaggi_somministrati (codice_azienda, id_sondaggio, id_somministrazione, data_esecuzione, id_anagrafica, object_name, object_key, id_modello_test, id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, note, pct_da, pct_da_manuale, id_modello_test_vr) 
SELECT $3,entrasp.grc_id_sondaggio($1,$3,id_sondaggio), entrasp.grc_somministrazione_piu_1($1), data_esecuzione, id_anagrafica, object_name, object_key, entrasp.grc_id_mdt($1,$3,id_modello_test,id_modello_test_vr), id_sottomodello, object_description, punteggio_massimo, punteggio_ottenuto, stato, id_risultato, note, pct_da, pct_da_manuale, id_modello_test_vr
from entrasp.sondaggi_somministrati
where codice_azienda=$1 and id_sondaggio=$2;

/*INSERT INTO entrasp.sondaggi_somministrati_oggetti_considerati(codice_azienda, id_sondaggio, id_somministrazione, object_name, object_key, object_description) 
SELECT $3,entrasp.grc_id_sondaggio($1,$3,id_sondaggio), entrasp.grc_id_somministrazione($1,$3,id_somministrazione), object_name, object_key, object_description
from entrasp.sondaggi_somministrati_oggetti_considerati
where codice_azienda=$1 and id_sondaggio=$2;*/

INSERT INTO entrasp.risposte(codice_azienda, id_modello_test, id_risposta, risposta, id_domanda, id_risposta_prev, object_name, object_key, id_sondaggio, id_somministrazione, punteggio, peso, note, id_modello_test_vr, punteggio_risposta) 
SELECT $3, entrasp.grc_id_mdt($1,$3,id_modello_test, id_modello_test_vr), id_risposta, risposta,entrasp.grc_id_domanda($1,$3,id_domanda,id_modello_test, id_modello_test_vr), entrasp.grc_id_risposta_prev($1,$3,id_risposta_prev,id_modello_test, id_modello_test_vr, id_domanda) , object_name, object_key, entrasp.grc_id_sondaggio($1,$3,id_sondaggio), entrasp.grc_id_somministrazione($1,$3,id_somministrazione), punteggio, peso, note, id_modello_test_vr, punteggio_risposta 
from entrasp.risposte
where codice_azienda=$1 AND
entrasp.grc_id_domanda($1,$3,id_domanda, id_modello_test, id_modello_test_vr) is not null and id_sondaggio=$2;

$BODY$;

ALTER FUNCTION entrasp.grc_accoda_singolo_sondaggio(text, numeric, text)
    OWNER TO postgres;

