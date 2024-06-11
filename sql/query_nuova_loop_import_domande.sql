WITH 
-- CTE per ottenere la data massima di ricezione per ciascun cliente e rapporto
max_ricezione AS (
    SELECT 
        codice_cliente,
        codice_rapporto,
        MAX(data_ricezione) AS max_data_ricezione
    FROM 
        imports.verifiche_movimenti_finint
    GROUP BY 
        codice_cliente, codice_rapporto
),

-- CTE per ottenere la data massima di verifica per ciascun cliente
max_verifica AS (
    SELECT 
        codice_cliente,
        MAX(data_verifica) AS max_data_verifica
    FROM 
        imports.verifiche_clienti_finint
    WHERE 
        tipo_legame IN ('A', 'M')
    GROUP BY 
        codice_cliente
),

-- CTE per ottenere la combinazione massima di data verifica e data ricezione
max_date_combinations AS (
    SELECT 
        vcf.codice_cliente,
        dt.max_data_verifica,
        MAX(vcf.data_ricezione) AS max_data_ricezione
    FROM 
        imports.verifiche_clienti_finint vcf
    INNER JOIN 
        max_verifica dt ON vcf.codice_cliente = dt.codice_cliente AND vcf.data_verifica = dt.max_data_verifica
    INNER JOIN 
        imports.verifiche_movimenti_finint vmf ON vcf.codice_cliente = vmf.codice_cliente AND vcf.codice_rapporto = vmf.codice_rapporto
    GROUP BY 
        dt.max_data_verifica, vcf.codice_cliente
),

-- CTE per filtrare i clienti e rapporti validi
valid_customers AS (
    SELECT 
        vc.*
    FROM 
        imports.verifiche_clienti_finint vc
    INNER JOIN 
        max_date_combinations mdc ON vc.codice_cliente = mdc.codice_cliente AND vc.data_verifica = mdc.max_data_verifica AND vc.data_ricezione = mdc.max_data_ricezione
    WHERE 
        vc.tipo_legame IN ('A', 'M')
        AND COALESCE(TRIM(vc.rete, '0'), '') != '7'
        AND vc.data_verifica != '0'
),

-- CTE per i movimenti associati ai clienti validi
filtered_movements AS (
    SELECT 
        vm.*
    FROM 
        imports.verifiche_movimenti_finint vm
    INNER JOIN 
        max_ricezione mr ON vm.codice_cliente = mr.codice_cliente AND vm.codice_rapporto = mr.codice_rapporto AND vm.data_ricezione = mr.max_data_ricezione
),

-- CTE per ottenere i contratti validi
valid_contracts AS (
    SELECT 
        cnt.*
    FROM 
        entrasp.contratti cnt
    WHERE 
        cnt.codice_azienda = 'FININTSGR'
        AND cnt.stato != 'C'
),

-- CTE per la verifica dei profili scaduti
expired_profiles AS (
    SELECT 
        codice
    FROM 
        entrasp.anagrafiche_id
    WHERE 
        entrasp.is_expired_profile('FININTSGR', id_anagrafica)
)

-- Query finale che unisce tutte le CTE precedenti
SELECT 
    vc.codice_cliente,
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
    string_agg(DISTINCT vm.origine_fondi, ' - ') AS origine_fondi,
    vm.paese_dest_fondi,
    string_agg(DISTINCT vm.ragionevolezza_operazione, ' - ') AS ragionevolezza_operazione,
    string_agg(DISTINCT vm.coerenza_invest_switch_clien, ' - ') AS coerenza_invest_switch_clien,
    string_agg(DISTINCT vm.coerenza_invest_switch_patri, ' - ') AS coerenza_invest_switch_patri,
    string_agg(DISTINCT vm.coerenza_econom_finanzclien, ' - ') AS coerenza_econom_finanzclien,
    string_agg(DISTINCT vm.coerenza_attivi_profesclien, ' - ') AS coerenza_attivi_profesclien,
    vm.comportam_tenuto_sportello,
    vm.modalità_operativa,
    vm.provincia_dest_fondi
FROM 
    valid_customers vc
INNER JOIN 
    imports.verifiche_anagrafiche_finint va ON LTRIM(va.cliente, '0') = LTRIM(vc.codice_cliente, '0')
INNER JOIN 
    filtered_movements vm ON vc.codice_cliente = vm.codice_cliente AND vc.codice_rapporto = vm.codice_rapporto
INNER JOIN 
    valid_contracts cnt ON SUBSTRING(cnt.numero_contratto, 0, STRPOS(cnt.numero_contratto, SPLIT_PART(cnt.numero_contratto, '-', 3)) - 1) = TRIM(va.ambiente || '-' || LPAD(va.rapporto, 8, '0'))
AND cnt.id_cliente = (
    SELECT DISTINCT id_anagrafica
    FROM entrasp.anagrafiche_vr
    WHERE codice = LPAD(va.cliente, 8, '0') AND codice_part = 'FININT'
)
WHERE 
    vc.codice_cliente || '-' || vc.data_ricezione NOT IN (
        SELECT 
            an.codice || '-' || REPLACE(ss.data_esecuzione::VARCHAR, '-', '') 
        FROM 
            entrasp.sondaggi_somministrati ss 
        INNER JOIN 
            entrasp.anagrafiche_id an ON ss.codice_part = an.codice_part AND SPLIT_PART(ss.object_key, '|', 2)::NUMERIC = an.id_anagrafica
        INNER JOIN 
            entrasp.sondaggi snd ON ss.codice_azienda = snd.codice_azienda AND ss.id_sondaggio = snd.id_sondaggio
        INNER JOIN 
            entrasp.modelli_test mt ON snd.codice_azienda = mt.codice_azienda AND snd.id_modello_test = mt.id_modello_test    
        WHERE 
            ss.codice_part = 'FININT' 
            AND mt.id_modello_test = 634 
            AND an.codice || '-' || ss.data_esecuzione IS NOT NULL
        GROUP BY 
            an.codice, ss.data_esecuzione
    )
    AND vc.codice_cliente IN (SELECT codice FROM expired_profiles)
GROUP BY 
    vc.codice_cliente,
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
ORDER BY 
    vc.codice_cliente DESC;
