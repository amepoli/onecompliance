-- FUNCTION: entrasp.crea_segnalazione_tic_dora_56019(character varying, date, character varying)

-- DROP FUNCTION IF EXISTS entrasp.crea_segnalazione_tic_dora_56019(character varying, date, character varying);

CREATE OR REPLACE FUNCTION entrasp.crea_segnalazione_tic_dora_56019(
	codiceaziefornitori_rec nda character varying,
	datarif date,
	username character varying
	)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE 
    idrisorsa numeric;											
    maxprogrev numeric;
    codicepart varchar;
    idcompilatore numeric;
    maxvalore numeric;
    maxinvio numeric;
		flag_cons boolean;
		idargomentotipoallegato numeric; 
    existing_progrev numeric;
    contratti_record RECORD;
    voci_record RECORD;
		voce RECORD;
    sql_query TEXT;
		entita_reg numeric;
		codleireg varchar;
		rag_soc varchar;
		codnaz varchar;
		arg_entita numeric;
		autor_comp varchar;
		succursali RECORD;
		entita_seg RECORD;
		contratti_spec RECORD;
		contratti_infra RECORD;
		firmatari_rec RECORD;
		firmatari_forn_rec RECORD;
		firmatari_infra_rec RECORD;
		contr_succ RECORD;
		fornitori_rec RECORD;

		


BEGIN
     idargomentotipoallegato = 56019; 
-- Recupero entità che mantiene il registro
select id_anagrafica_registro from entrasp.cdms_risorse
where codice_azienda=codiceazienda and id_argomento_tipo_allegato=idargomentotipoallegato into entita_reg;

select segn_consolidata::boolean from entrasp.aziende where codice_azienda=codiceazienda into flag_cons;

-- Recupera id_risorsa
    SELECT id_risorsa 
    INTO idrisorsa
    FROM entrasp.cdms_risorse 
    WHERE codice_azienda = codiceazienda 
      AND id_argomento_tipo_allegato = idargomentotipoallegato;

IF idrisorsa IS NULL THEN
        RAISE EXCEPTION 'Id risorsa non trovato per codice_azienda % e idargomentotipoallegato %', codiceazienda, idargomentotipoallegato;
    END IF;

-- Controlla se esiste già una revisione con la stessa data_rif
    SELECT prog_revisione 
    INTO existing_progrev
    FROM entrasp.cdms_risorse_revisioni 
    WHERE codice_azienda = codiceazienda 
      AND id_risorsa = idrisorsa
      AND data_rif = datarif
    ORDER BY prog_revisione DESC
    LIMIT 1;

    IF existing_progrev IS NOT NULL THEN
        maxprogrev := existing_progrev;
        -- Recupera max invio
        SELECT COALESCE(MAX(invio), 0) + 1
        INTO maxinvio
        FROM entrasp.segnalazioni_vigilanza_righe
        WHERE codice_azienda = codiceazienda
          AND id_risorsa = idrisorsa
          AND prog_revisione = maxprogrev;
    ELSE
        -- Crea una nuova revisione
        SELECT COALESCE(MAX(prog_revisione), 0) + 1 
        INTO maxprogrev
        FROM entrasp.cdms_risorse_revisioni 
        WHERE codice_azienda = codiceazienda 
          AND id_risorsa = idrisorsa;

        SELECT codice_part 
        INTO codicepart 
        FROM entrasp.aziende 
        WHERE codice_azienda = codiceazienda;

        SELECT id_anagrafica 
        INTO idcompilatore 
        FROM entrasp.anagrafiche_id 
        WHERE codice_part = codicepart 
          AND dynamo_user = username;

INSERT INTO entrasp.cdms_risorse_revisioni (
                codice_azienda, id_risorsa, prog_revisione, data_creazione, 
                file_id, revisore, client_file_name, content_type, 
                data_rif, id_argomento_stato, descrizione
            ) 
            VALUES (
                codiceazienda, idrisorsa, maxprogrev, CURRENT_DATE,
                gen_random_uuid(), idcompilatore, 
                current_date || '_segnalazione_DORA',
                'tbd', datarif, 53990, 'Segnalazione TIC DORA'
            );		

maxinvio := 1;

END IF;
SELECT COALESCE(MAX(id_valore), 0) + 1
    INTO maxvalore
    FROM entrasp.segnalazioni_vigilanza_righe
    WHERE codice_azienda = codiceazienda;



-- (B_01.01) Entità che mantiene il registro delle informazioni

				SELECT an.codice_lei, avr.ragione_sociale, avr.codice_nazione, avr.id_argomento_entita, avr.autorita_competente 
				from entrasp.anagrafiche_id an 
				inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part and an.id_anagrafica=avr.id_anagrafica
				where an.codice_part=codicepart  and an.id_anagrafica=entita_reg and avr.prog_vr=entrasp.anagrafiche_vr_max(codicepart, avr.id_anagrafica)
				INTO codleireg, rag_soc,codnaz,arg_entita,autor_comp;


maxvalore := maxvalore + 6;
							INSERT INTO entrasp.segnalazioni_vigilanza_righe(
		                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
		                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio
		                ) 

							SELECT
										maxvalore-5, codleireg::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 523, maxinvio
						  UNION ALL
							SELECT
										maxvalore-4, rag_soc::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 524, maxinvio
						  UNION ALL
							SELECT
										maxvalore-3, codnaz::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 525, maxinvio
						  UNION ALL
							SELECT
										maxvalore-2, NULL::varchar, NULL::numeric, NULL::date, arg_entita::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 526, maxinvio
						  UNION ALL
							SELECT
										maxvalore-1, autor_comp::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 527, maxinvio
						  UNION ALL
							SELECT
										maxvalore, NULL::varchar, NULL::numeric, current_date::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 528, maxinvio;
						 

-- (B_01.02) Elenco delle entità incluse nell'ambito del consolidamento

				FOR entita_seg in
						select an.codice_lei as segnalata, avr.ragione_sociale, avr.codice_nazione, avr.id_argomento_entita, avr.id_argomento_gerarchia, 
						an2.codice_lei as madre, current_date, avr.data_ins_reg, avr.data_delete_reg, avr.codice_valuta, avr.importo_attivita, an.id_anagrafica
						from entrasp.anagrafiche_id an 
						inner join entrasp.anagrafiche an2 on an.codice_part=an2.codice_part and an.id_anagrafica_madre=an2.id_anagrafica
						inner join entrasp.anagrafiche_vr avr on an.id_anagrafica=avr.id_anagrafica and an.codice_part=avr.codice_part
						where an.codice_part=codicepart and data_ins_reg is not null and avr.prog_vr=entrasp.anagrafiche_vr_max(codicepart, an.id_anagrafica)
				LOOP

						maxvalore := maxvalore + 11;

							INSERT INTO entrasp.segnalazioni_vigilanza_righe(
		                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
		                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_anagrafica
		                ) 

							SELECT
										maxvalore-10, entita_seg.segnalata::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 529, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-9, entita_seg.ragione_sociale::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 530, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-8, entita_codice_nazione::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 531, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-7, NULL::varchar, NULL::numeric, NULL::date, entita_seg.id_argomento_entita::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 532, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-6, NULL::varchar, NULL::numeric, NULL::date, entita_seg.id_argomento_gerarchia::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 533, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-5, entita_seg.madre::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 534, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-4, NULL::varchar, NULL::numeric, NULL::date, current_date::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 535, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-3, NULL::varchar, NULL::numeric, NULL::date, data_ins_reg::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 536, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-2, NULL::varchar, NULL::numeric, NULL::date, data_delete_reg::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 537, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-1, codice_valuta::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 538, maxinvio, entita_seg.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore, NULL::varchar, importo_attivita::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 539, maxinvio, entita_seg.id_anagrafica;

					END LOOP;

-- (B_01.03) Elenco delle succursali

					FOR succursali in
							select distinct an2.codice_lei as lei_succurs, an.codice_lei as lei_principale, avr2.ragione_sociale, avr2.codice_nazione, an.id_anagrafica 
							from entrasp.connessioni_anagrafiche con 
							inner join entrasp.anagrafiche_id an on con.codice_part=an.codice_part and con.id_anagrafica=an.id_anagrafica
							inner join entrasp.anagrafiche_vr avr on an.id_anagrafica=avr.id_anagrafica and an.codice_part=avr.codice_part
							inner join entrasp.anagrafiche_id an2 on con.codice_part=an2.codice_part and con.id_anagrafica_conn=an2.id_anagrafica
							inner join entrasp.anagrafiche_vr avr2 on an2.id_anagrafica=avr2.id_anagrafica and an2.codice_part=avr2.codice_part
							where con.codice_part=codicepart and con.codice_ruolo='SUCC' and avr.data_ins_reg is not null and avr.data_delete_reg is null
							and avr.prog_vr=entrasp.anagrafiche_vr_max(codicepart, avr.id_anagrafica)
					LOOP

					maxvalore := maxvalore + 4;

					INSERT INTO entrasp.segnalazioni_vigilanza_righe(
		                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
		                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_anagrafica
		                ) 

							SELECT
										maxvalore-3, succursali.lei_succurs::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 540, maxinvio, succursali.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-2, succursali.lei_principale::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 541, maxinvio, succursali.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore-1, succursali.ragione_sociale::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 542, maxinvio, succursali.id_anagrafica
						  UNION ALL
							SELECT
										maxvalore, succursali.codice_nazione::varchar, NULL::numeric, NULL::date, NULL::numeric,
						        idrisorsa, codiceazienda, maxprogrev, 543, maxinvio, succursali.id_anagrafica;

					END LOOP;

-- (B_02.01) Accordi contrattuali - informazioni generali

					FOR contratti_record in 
						SELECT cnt.numero_contratto as num_contr, cnt.id_argomento_tipo_contratto_eba, cnt2.numero_contratto as num_contr_gen, cnt.codice_valuta, cnt.tariffa_mensile*12 as imp_ann, cnt.id_contratto
						FROM entrasp.contratti cnt 
						inner join entrasp.contratti snt2 on cnt.codice_azienda=cnt2.codice_azienda and cnt.id_contratto_parent=cnt2.id_contratto
 						WHERE cnt.codice_azienda = codiceazienda
					      AND cnt.id_tipo_contratto = 2
					      AND cnt.stato = 'A'
								AND cnt.flag_fornitore_tic = '1'
								and infragruppo = '0'
					LOOP

							maxvalore := maxvalore + 5;

							INSERT INTO entrasp.segnalazioni_vigilanza_righe(
				                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
				                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_contratto
				                ) 
		
							SELECT
												maxvalore-4, contratti_record.num_contr::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 544, maxinvio, contratti_record.id_contratto
							UNION ALL
							SELECT
												maxvalore-3, NULL::varchar, NULL::numeric, NULL::date, contratti_record.id_argomento_tipo_contratto_eba::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 545, maxinvio, contratti_record.id_contratto
							UNION ALL
							SELECT
												maxvalore-2, contratti_record.num_contr_gen::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 546, maxinvio, contratti_record.id_contratto
							UNION ALL
							SELECT
												maxvalore-1, contratti_record.codice_valuta::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 547, maxinvio, contratti_record.id_contratto
							UNION ALL
							SELECT
												maxvalore, NULL::varchar, contratti_record.imp_ann::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 548, maxinvio, contratti_record.id_contratto;

					END LOOP;

-- (B_02.02) Accordi contrattuali -informazioni specifiche

					FOR contratti_spec in 
						SELECT distinct cnt.id_contratto,
			 cnt.numero_contratto,
			 utilizzatore.codice_lei as lei_utilizzatore,
			 coalesce (an.codice_lei, avr.partita_iva) as codice_fornitore,
			 CASE 
        	WHEN an.codice_lei IS NOT NULL THEN 'eba_qCO:qx2000'
        	ELSE 'eba_qCO:qx2004'
    		END as tipo_codice,
				concat('F',cacg.prog_codice_part)as codice_funzione,
				CASE 
	        WHEN cnt.id_argomento_mod_esternalizzazione IN (54076, 54077, 54078) 
	        THEN cnt.id_argomento_mod_esternalizzazione
	        ELSE cnt.id_argomento_servizio_eba
    		END as servizio_tic,
				cnt.data_contratto_da as data_inizio,
				coalesce (cnt.data_contratto_a,'9999-12-31') as data_fine, 
				cnt.id_argomento_risoluzione as mot_risoluz,
				cnt.termini_preavviso as preavv_entita,
				cnt.preavviso_intermediario as preavv_forn,
				cnt.id_paese_diritto_applicabile,
				ans.stato as stato_erog,
				flag_conservazione,
				ans2.stato as stato_mem,
				ans3.stato as stato_trat,
				cnt.id_argomento_sensibilita,
				cnt.id_argomento_liv_dipendenza				 
						FROM entrasp.contratti cnt 
						inner join entrasp.anagrafiche_id an on cnt.codice_part=an.codice_part and cnt.id_cliente=an.id_anagrafica
						inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part and an.id_anagrafica=avr.id_anagrafica
						left join entrasp.anagrafiche_id utilizzatore on cnt.codice_part=utilizzatore.codice_part and cnt.utilizzatore=utilizzatore.id_anagrafica
						left join entrasp.contratti_articoli_centri_gestionali cacg on cnt.codice_azienda=cacg.codice_azienda and cnt.id_contratto=cacg.id_contratto
						left join entrasp.anagrafiche_sedi ans on cnt.codice_azienda=ans.codice_azienda and cnt.id_cliente=ans.id_anagrafica AND ans.id_argomento_tipo_sede = 55723
						left join entrasp.anagrafiche_sedi ans2 on cnt.codice_azienda=ans2.codice_azienda and cnt.id_cliente=ans2.id_anagrafica AND ans2.id_argomento_tipo_sede = 55724
						left join entrasp.anagrafiche_sedi ans3 on cnt.codice_azienda=ans3.codice_azienda and cnt.id_cliente=ans3.id_anagrafica AND ans3.id_argomento_tipo_sede = 56330
 						WHERE cnt.codice_azienda = codiceazienda
					      AND cnt.id_tipo_contratto = 2
								AND cnt.flag_fornitore_tic = '1'
								and cnt.infragruppo = '0'
								and avr.prog_vr=entrasp.anagrafiche_vr_max(cnt.codice_part, cnt.id_cliente)
					LOOP
					
							maxvalore := maxvalore + 18;

							INSERT INTO entrasp.segnalazioni_vigilanza_righe(
				                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
				                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_contratto
				                ) 
							SELECT
												maxvalore-17, contratti_spec.numero_contratto::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 549, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-16, contratti_spec.lei_utilizzatore::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 550, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-15, contratti_spec.codice_fornitore::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 551, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-14, contratti_spec.tipo_codice::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 552, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-13, contratti_spec.codice_funzione::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 553, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-12, NULL::varchar, NULL::numeric, NULL::date, contratti_spec.servizio_tic::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 554, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-11, NULL::varchar, NULL::numeric, contratti_spec.data_inizio::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 555, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-10, NULL::varchar, NULL::numeric, contratti_spec.data_fine::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 556, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-9, NULL::varchar, NULL::numeric, NULL::date, contratti_spec.mot_risoluz::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 557, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-8, NULL::varchar, contratti_spec.preavv_entita::numeric, NULL::date, null::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 558, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-7, NULL::varchar, contratti_spec.preavv_forn::numeric, NULL::date, null::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 559, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-6, contratti_spec.id_paese_diritto_applicabile::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 560, maxinvio, contratti_spec.id_contratto
							UNION ALL 
							SELECT
												maxvalore-5, contratti_spec.stato_erog::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 561, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-4, null::varchar, NULL::numeric, NULL::date, CASE WHEN contratti_spec.flag_conservazione='0' THEN 2372 ELSE 6765 END,
								        idrisorsa, codiceazienda, maxprogrev, 562, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-3, contratti_spec.stato_mem::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 563, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-2, contratti_spec.stato_trat::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 564, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore-1, NULL::varchar, NULL::numeric, NULL::date, contratti_spec.id_argomento_sensibilita::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 565, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore, NULL::varchar, NULL::numeric, NULL::date, contratti_spec.id_argomento_liv_dipendenza::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 566, maxinvio, contratti_spec.id_contratto;

				END LOOP;

-- (B_02.03) Elenco degli accordi contrattuali intragruppo

				FOR contratti_infra in 
						select cnt.numero_contratto as contr_entita, cnt2.numero_contratto as contr_forn, cnt.id_contratto from entrasp.contratti cnt
							inner join entrasp.contratti_contratti cc on cnt.codice_part=cc.codice_part and cnt.id_contratto=cc.id_contratto
							inner join entrasp.contratti cnt2 on cc.codice_part=cnt2.codice_part and cc.id_contratto_collegato=cnt2.id_contratto
						where  
							cnt.infragruppo = '1'
							AND (
        			(segn_cons = true AND cnt.codice_part = codicepart) 
        				OR 
        			(segn_cons = false AND cnt.codice_azienda = codiceazienda))
							
				LOOP
					
							maxvalore := maxvalore + 2;

							INSERT INTO entrasp.segnalazioni_vigilanza_righe(
				                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
				                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_contratto
				                ) 
							SELECT
												maxvalore-1, contratti_infra.contr_entita::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 567, maxinvio, contratti_spec.id_contratto
							UNION ALL
							SELECT
												maxvalore, contratti_infra.contr_contr_forn::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 568, maxinvio, contratti_spec.id_contratto;

			END LOOP;

-- (B_03.01) Entità che firmano gli accordi contrattuali per ricevere il servizio

		 FOR firmatari_rec in 
					select cnt.numero_contratto, an.codice_lei, cnt.id_contratto  from entrasp.contratti cnt
					inner join entrasp.anagrafiche_id an on cnt.codice_part=an.codice_part and cnt.firmatario=an.id_anagrafica
					where codice_azienda=codiceazienda

			LOOP

					maxvalore := maxvalore + 2;

							INSERT INTO entrasp.segnalazioni_vigilanza_righe(
				                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
				                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_contratto
				                ) 
							SELECT
												maxvalore-1, firmatari_rec.numero_contratto::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 569, maxinvio, firmatari_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore, firmatari_rec.codice_lei::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 570, maxinvio, firmatari_rec.id_contratto;

			END LOOP;

-- (B_03.02) Entità che firmano gli accordi contrattuali fornitore terzo			

					FOR firmatari_forn_rec in 
					
					SELECT 
					cnt.numero_contratto, cnt.id_contratto,
					coalesce (an.codice_lei, avr.partita_iva) as codice_fornitore,
			 		CASE 
        	WHEN an.codice_lei IS NOT NULL THEN 'eba_qCO:qx2000'
        	ELSE 'eba_qCO:qx2004'
					END as tipo_codice
					FROM entrasp.contratti cnt
					INNER JOIN  entrasp.anagrafiche_id an ON cnt.codice_part = an.codice_part AND cnt.id_firmatario_fornitore = an.id_anagrafica
					INNER JOIN entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part and an.id_anagrafica=avr.id_anagrafica
					WHERE cnt.codice_azienda = codiceazienda AND cnt.infragruppo = '0'
					and avr.prog_vr=entrasp.anagrafiche_vr_max(cnt.codice_part, cnt.id_cliente);

					LOOP

					maxvalore := maxvalore + 3;

							INSERT INTO entrasp.segnalazioni_vigilanza_righe(
				                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
				                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_contratto
				                ) 
							SELECT
												maxvalore-2, firmatari_forn_rec.numero_contratto::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 571, maxinvio, firmatari_forn_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore-1, firmatari_forn_rec.codice_fornitore::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 572, maxinvio, firmatari_forn_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore, firmatari_forn_rec.tipo_codice::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 573, maxinvio, firmatari_forn_rec.id_contratto;
					END LOOP;

	-- (B_03.03) Entità che firmano gli accordi contrattuali fornitore infragruppo				

FOR firmatari_infra_rec in 
					
					SELECT 
					cnt.numero_contratto, cnt.id_contratto,
					an.codice_lei
					FROM entrasp.contratti cnt
					INNER JOIN  entrasp.anagrafiche_id an ON cnt.codice_part = an.codice_part AND cnt.id_firmatario_fornitore = an.id_anagrafica
					WHERE cnt.codice_azienda = codiceazienda AND cnt.infragruppo = '1'

					LOOP

					maxvalore := maxvalore + 2;

							INSERT INTO entrasp.segnalazioni_vigilanza_righe(
				                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
				                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_contratto
				                ) 
							SELECT
												maxvalore-1, firmatari_infra_rec.numero_contratto::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 574, maxinvio, firmatari_infra_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore, firmatari_infra_rec.tipo_codice::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 575, maxinvio, firmatari_infra_rec.id_contratto;
					END LOOP;


	-- (B_04.01) Entità che si avvalgono dei servizi TIC	
			FOR contr_succ in		
				SELECT distinct
					cnt.numero_contratto, cnt.id_contratto,
					an.codice_lei,
					case when con.codice_ruolo='SUCC' then 56061 else 56062 end as natura_entita
					FROM entrasp.contratti cnt
					inner JOIN  entrasp.anagrafiche_id an ON cnt.codice_part = an.codice_part AND cnt.utilizzatore = an.id_anagrafica
					left join entrasp.connessioni_anagrafiche con on an.codice_part=con.codice_part and an.id_anagrafica=con.id_anagrafica_conn
					WHERE cnt.codice_azienda = codiceazienda and cnt.id_tipo_contratto=2
			LOOP

							maxvalore := maxvalore + 4;

							INSERT INTO entrasp.segnalazioni_vigilanza_righe(
				                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
				                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_contratto
				                ) 
							SELECT
												maxvalore-3, contr_succ.numero_contratto::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 576, maxinvio, contr_succ.id_contratto
							UNION ALL
							SELECT
												maxvalore-2, contr_succ.codice_lei::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 577, maxinvio, contr_succ.id_contratto
							UNION ALL
							SELECT
												maxvalore-1, NULL::varchar, NULL::numeric, NULL::date, contr_succ.natura_entita::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 578, maxinvio, contr_succ.id_contratto
							UNION ALL
							SELECT
												maxvalore, contr_succ.codice_lei::varchar, NULL::numeric, NULL::date, null::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 579, maxinvio, contr_succ.id_contratto;

							END LOOP;

	-- (B_05.01) Fornitori terzi di servizi TIC

For fornitori_rec in
SELECT distinct 
			 coalesce (an.codice_lei, avr.partita_iva) as codice_fornitore,
			 CASE 
        	WHEN an.codice_lei IS NOT NULL THEN 'eba_qCO:qx2000'
        	ELSE 'eba_qCO:qx2004'
    	 END as tipo_codice,
			 coalesce (avr.ragione_sociale, an.nome||' '||an.cognome) as denominazione,
			 case when an.tipo_soggetto = 'P' then 56301 ELSE 56300 END as tipo_persona,
			 avr.codice_nazione,
			 cnt.codice_valuta,
			 entrasp.somma_tariffe_mensili(cnt.codice_azienda, cnt.id_cliente) as spese_annue,
			 case when an2.codice_lei is null then an.codice_lei Else an2.codice_lei end as lei_capogruppo_forn,
			 'eba_qCO:qx2000' as tipo_codice_lei				
					FROM entrasp.contratti cnt
					inner JOIN  entrasp.anagrafiche_id an ON cnt.codice_part = an.codice_part AND cnt.id_cliente = an.id_anagrafica
					inner join entrasp.anagrafiche_vr avr on an.codice_part=avr.codice_part and an.id_anagrafica=avr.id_anagrafica
					inner join entrasp.anagrafiche_id an2 on an.codice_part=an2.codice_part and avr.id_anagrafica_capogruppo=an2.id_anagrafica
					WHERE cnt.codice_azienda = 'DEMO' and id_tipo_contratto=2
			LOOP

			maxvalore := maxvalore + 10;
					
			INSERT INTO entrasp.segnalazioni_vigilanza_righe(
				                    id_valore, valore_testo, valore_num, valore_data, valore_id_argomento, 
				                    id_risorsa, codice_azienda, prog_revisione, id_voce_segnalazione, invio, id_contratto
				                ) 
							SELECT
												maxvalore-9, fornitori_rec.codice_fornitore::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 580, maxinvio, fornitori_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore-8, fornitori_rec.tipo_codice::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 581, maxinvio, fornitori_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore-7, fornitori_rec.denominazione::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 584, maxinvio, fornitori_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore-6, fornitori_rec.denominazione::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 585, maxinvio, fornitori_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore-5, NULL::varchar, NULL::numeric, NULL::date, fornitori_rec.tipo_persona::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 586, maxinvio, fornitori_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore-4, fornitori_rec.codice_nazione::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 587, maxinvio, fornitori_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore-3, fornitori_rec.codice_valuta::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 588, maxinvio, fornitori_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore-2, NULL::varchar, fornitori_rec.spese_annue::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 589, maxinvio, fornitori_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore-1, fornitori_rec.lei_capogruppo_forn::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 590, maxinvio, fornitori_rec.id_contratto
							UNION ALL
							SELECT
												maxvalore, fornitori_rec.tipo_codice_lei::varchar, NULL::numeric, NULL::date, NULL::numeric,
								        idrisorsa, codiceazienda, maxprogrev, 591, maxinvio, fornitori_rec.id_contratto;

					END LOOP;


	-- (B_05.02) Catena di approvvigionamento dei servizi TIC







	


END;
$BODY$;

ALTER FUNCTION entrasp.crea_segnalazione_tic_dora_56019(character varying, date, character varying)
    OWNER TO postgres;
