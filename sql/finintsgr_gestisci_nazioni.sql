
--inserisco la data di fine validità
UPDATE entrasp.nazioni_rischio
SET data_fine_validita = current_date-1
where data_fine_validita is null;

--inserisco i nuovi record
INSERT INTO entrasp.nazioni_rischio (codice_nazione, data_inizio_validita)
SELECT codice_nazione, CURRENT_DATE
FROM entrasp.nazioni;

--Aggiorno i rischi nella tabella
UPDATE entrasp.nazioni_rischio
SET rischio = CASE 
				WHEN rischio IS NULL THEN ARRAY['B']::VARCHAR[] 
                WHEN NOT rischio @> ARRAY['B']::varchar[] THEN array_append(rischio, 'B')
                ELSE rischio
              END
WHERE cod_banca_italia IN (4,8,9,12,21,28,29,32,40,41,48,50,54,55,61,67,68,77,86,87,92,94,100,101,105,204,234,235,257,258,259,260,261,275,276,292);
and data_inizio_validita=current_date and data_fine_validita is null;

--Assegnare rischio C
UPDATE entrasp.nnazioni_rischio
SET rischio = CASE 
				WHEN rischio IS NULL THEN ARRAY['C']::VARCHAR[] 
                WHEN NOT rischio @> ARRAY['C']::varchar[] THEN array_append(rischio, 'C')
                ELSE rischio 
              END
WHERE cod_banca_italia IN (3,5,6,7,11,13,15,17,19,22,24,31,37,46,49,53,59,63,64,69,69,71,72,78,80,82,84,84,88,90,91,97,98,103,106,107,109,110,114,115,122,123,124,125,126,127,128,129,147,156,159,162,163,168,169,182,188,190,191,192,193,194,195,196,199,200,203,205,207,208,210,212,213,214,215,216,217,218,219,220,220,222,225,226,237,238,247,248,252,253,254,256,265,266,267,268,268,270,278,279,287,289,290,291,293,294,295,296);
and data_inizio_validita=current_date and data_fine_validita is null;

--Assegnare rischio D
UPDATE entrasp.nazioni_rischio
SET rischio = CASE 
				WHEN rischio IS NULL THEN ARRAY['D']::VARCHAR[] 
                WHEN NOT rischio @> ARRAY['D']::varchar[] THEN array_append(rischio, 'D')
                ELSE rischio 
              END
WHERE cod_banca_italia IN (2,10,25,33,34,35,36,38,39,42,44,45,47,52,56,58,65,66,70,73,74,81,83,89,95,104,112,113,117,119,119,130,132,133,134,135,136,137,138,141,143,144,145,146,149,150,151,151,153,155,157,158,160,164,166,167,176,176,185,185,186,187,262,268,268,270,271,272,273,277,283,297);
and data_inizio_validita=current_date and data_fine_validita is null;

--Assegnare rischio E
UPDATE entrasp.nazioni_rischio
SET rischio = CASE 
			    WHEN rischio IS NULL THEN ARRAY['E']::VARCHAR[] 
                WHEN NOT rischio @> ARRAY['E']::varchar[] THEN array_append(rischio, 'E')
                ELSE rischio 
              END
WHERE cod_banca_italia IN (2,16,20,25,26,33,34,38,39,42,45,47,62,65,66,70,73,74,74,75,76,81,83,85,95,103,117,143,145,149,185,262,262,263,264,265,274,274,277,297);
and data_inizio_validita=current_date and data_fine_validita is null;

--Assegnare rischio F
UPDATE entrasp.nazioni_rischio
SET rischio = CASE 
				WHEN rischio IS NULL THEN ARRAY['F']::VARCHAR[] 
                WHEN NOT rischio @> ARRAY['F']::varchar[] THEN array_append(rischio, 'F')
                ELSE rischio 
              END
WHERE cod_banca_italia IN (12,18,23,27,33,39,39,44,47,51,57,74,74,78,83,102,112,116,118,120,121,131,142,148,152,154,161,189,197,198,201,202,206,209,211,216,221,222,239,240);
and data_inizio_validita=current_date and data_fine_validita is null;

--Assegnare rischio G
UPDATE entrasp.nazioni_rischio
SET rischio = CASE 
				WHEN rischio IS NULL THEN ARRAY['G']::VARCHAR[] 
                WHEN NOT rischio @> ARRAY['G']::varchar[] THEN array_append(rischio, 'G')
                ELSE rischio 
              END
WHERE cod_banca_italia IN (20,39,65,74);
and data_inizio_validita=current_date and data_fine_validita is null;

--Assegnare rischio H
UPDATE entrasp.nazioni_rischio
SET rischio = CASE 
				WHEN rischio IS NULL THEN ARRAY['H']::VARCHAR[] 
                WHEN NOT rischio @> ARRAY['H']::varchar[] THEN array_append(rischio, 'H')
                ELSE rischio 
              END
WHERE cod_banca_italia IN (2,18,27,34,39,39,42,51,57,62,65,74,74,78,82,83,102,117,118,119,120,121,132,134,142,145,149,152,239,240,241,242,243,244,274,274,297);
and data_inizio_validita=current_date and data_fine_validita is null;


--Per FSI aggiornamento dei template risposte delle nazioni
select entrasp.aggiorna_template_nazioni('FSI', 9)

--e delle province
select entrasp.aggiorna_template_province('FSI', 8)


