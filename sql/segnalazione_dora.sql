-- FUNCTION: entrasp.crea_segnalazione_tic_dora_56019(character varying, date, character varying)

-- DROP FUNCTION IF EXISTS entrasp.crea_segnalazione_tic_dora_56019(character varying, date, character varying);

CREATE OR REPLACE FUNCTION entrasp.crea_segnalazione_tic_dora_56019(
	codiceazienda character varying,
	datarif date,
	username character varying)
    RETURNS void
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE 
    idrisorsa numeric;											codleireg, rag_soc,codnaz,arg_entita,autor_comp
    maxprogrev numeric;
    codicepart varchar;
    idcompilatore numeric;
    maxvalore numeric;
    maxinvio numeric;
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
		
		firm_as numeric;
		firm_lei varchar;
		forn_codi_as numeric;
		cap_forn_codi_as numeric;
		forn_codice_lei varchar;
 		utiliz_codice_as numeric;
		utiliz_codice_lei varchar;
		forn_cloud numeric;
		motivazione_fei_record  RECORD;
		subforn RECORD;
		current_row_num INT;

BEGIN
     idargomentotipoallegato = 56019; 
-- Recupero entità che mantiene il registro
select id_anagrafica_registro from entrasp.cdms_risorse
where codice_azienda=codiceazienda and id_argomento_tipo_allegato=idargomentotipoallegato into entita_reg;
		 

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
				where an.codice_part=codicepart  and an.id_anagrafica=entita_reg
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
							select distinct an2.codice_lei as lei_succurs, an.codice_lei as lei_principale, avr2.ragione_sociale, avr2.codice_nazione, an.id_anagrafica from entrasp.connessioni_anagrafiche con 
							inner join entrasp.anagrafiche_id an on con.codice_part=an.codice_part and con.id_anagrafica=an.id_anagrafica
							inner join entrasp.anagrafiche_vr avr on an.id_anagrafica=avr.id_anagrafica and an.codice_part=avr.codice_part
							inner join entrasp.anagrafiche_id an2 on con.codice_part=an2.codice_part and con.id_anagrafica_conn=an2.id_anagrafica
							inner join entrasp.anagrafiche_vr avr2 on an2.id_anagrafica=avr2.id_anagrafica and an2.codice_part=avr2.codice_part
							where con.codice_part=codicepart and con.codice_ruolo='SUCC' and avr.data_ins_reg is not null and avr.data_delete_reg is null
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
	Select cnt.*, avr.id_anagrafica_capogruppo as id_capogruppo_forn
	from entrasp.contratti cnt 
	inner join entrasp.anagrafiche_vr avr
	on cnt.id_cliente=avr.id_anagrafica and cnt.codice_part=avr.codice_part
	WHERE cnt.codice_azienda = codiceazienda
      AND cnt.id_tipo_contratto = 2
      AND cnt.stato = 'A'
			AND cnt.flag_fornitore_tic = '1'
			and flag_infragruppo = '0'
	  and avr.prog_vr=entrasp.anagrafiche_vr_max(cnt.codice_part, cnt.id_cliente)
	LOOP





					
	
 	return;

END;
$BODY$;

ALTER FUNCTION entrasp.crea_segnalazione_tic_dora_56019(character varying, date, character varying)
    OWNER TO postgres;
