CREATE OR REPLACE FUNCTION entrasp.crea_odg_template(
    codiceazienda varchar,
    idtemplateodg numeric,
    idcontratto numeric,
    idtemplateriunioni numeric,
    idargomentosettori numeric[] DEFAULT NULL::numeric[],
    idanagrafica numeric[] DEFAULT NULL::numeric[],
    durata_ numeric DEFAULT NULL::numeric,
    orainizio numeric DEFAULT NULL::numeric,
    datariunione timestamp DEFAULT ('now'::text)::date,
    idargomentofunzione numeric[] DEFAULT NULL::numeric[],
    cantiere_ text DEFAULT NULL::text,
    idargomentocontrollo numeric DEFAULT NULL::numeric,
    idodg numeric[] DEFAULT NULL::numeric[]
)
RETURNS text
LANGUAGE 'plpgsql'
COST 100
VOLATILE PARALLEL UNSAFE
AS $BODY$
DECLARE
    maxidodg numeric;
    idriunione numeric;
    codicepart varchar;
    titolo text;
    idargomentosettore numeric; -- Aggiunta della variabile di tipo numeric per il loop
	singleodg numeric;
BEGIN
    -- Recupera l'id della riunione
    SELECT id_riunione 
    INTO idriunione
    FROM entrasp.riunioni 
    WHERE codice_azienda = codiceazienda AND id_contratto = idcontratto;

    -- Se la riunione non esiste, crearla
    IF idriunione IS NULL THEN 
        SELECT COALESCE(MAX(id_riunione), 0) + 1
        INTO idriunione
        FROM entrasp.riunioni
        WHERE codice_azienda = codiceazienda;

        INSERT INTO entrasp.riunioni(codice_azienda, id_riunione, data_riunione, oggetto, id_contratto) 
        VALUES (
            codiceazienda,
            idriunione,
            datariunione,
            'Piano di Certificazione del contratto: ' || entrasp.contratti_descr_completa(idcontratto, codiceazienda),
            idcontratto
        );
    END IF;

  -- Se idodg è NULL, eseguire almeno un ciclo con valore NULL
    IF idodg IS NULL THEN
		idodg := ARRAY[NULL::numeric];

	end if;
		

  -- Se idargomentosettori è NULL, eseguire almeno un ciclo con valore NULL
     IF idargomentosettori IS NULL THEN
            idargomentosettori := ARRAY[NULL::numeric];
     END IF;      

	for singleodg in select unnest(idodgsettori) loop
		FOR idargomentosettore IN SELECT unnest(idargomentosettori)
            LOOP						                
				if singleodg is null then
						select coalesce(max(id_odg),0)+1
						from entrasp.odg_riunioni
						where codice_azienda=codiceazienda into
						maxidodg
			
						INSERT INTO entrasp.odg_riunioni (
		                    codice_azienda,
		                    id_riunione,
		                    id_odg,
		                    ordinamento_odg,
		                    titolo,
		                    id_argomento_settore,
		                    durata,
		                    ora_inizio,
		                    ora_fine,
		                    data_riunione,
		                    cantiere,
		                    id_argomento_controllo,
		                    id_argomento_funzione,
		                    id_templ_odg,
		                    id_templ_riunione
		                )
		                SELECT  
		                    codiceazienda,
		                    idriunione,
		                    maxidodg,
		                    1, 
		                    titolo, 
		                    idargomentosettore,
		                    durata_,
		                    orainizio,
		                    COALESCE(orainizio + durata, NULL),
		                    datariunione,
		                    cantiere_,
		                    idargomentocontrollo,
		                    idargomentofunzione,
		                    idtemplateodg,
		                    idtemplateriunioni
		                FROM entrasp.template_odg 
		                WHERE codice_azienda = codiceazienda 
		                AND id_templ_odg = idtemplateodg 
		                AND id_templ_riunioni = idtemplateriunioni;
					else
						update entrasp.odg_riunioni odg
						set ordinamento= coalesce(ordinamento, 1),
							id_argomento_settore=coalesce(idargomentosettore, id_argomento_settore),
							durata=coalesce(durata_, odg.durata),
							ora_inizio=coalesce(orainizio, ora_inizio)
							ora_fine=COALESCE(orainizio + durata_, ora_fine),
							data_riunione=coalesce(datariunione, odg.data_riunione),
							id_argomento_funzione=coalesce(idargomentofunzione, id_argomento_funzione)
						where codice_azienda=codiceazienda and id_odg=singleodg and id_riunione=idriunione;
				end if;
            END LOOP;
        END LOOP;

    RETURN 'Odg creato con successo';
END;
$BODY$;

ALTER FUNCTION entrasp.crea_odg_template(varchar, numeric, numeric, numeric, numeric[], numeric[], numeric, numeric, timestamp, numeric[], text, numeric, numeric[])
    OWNER TO postgres;
