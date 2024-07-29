ALTER TABLE entrasp.nazioni ADD COLUMN rischio_temp varchar(2)[];

-- Step 2: Copiare i dati convertiti dalla colonna originale alla colonna temporanea
UPDATE entrasp.nazioni
SET rischio_temp = ARRAY[rischio::varchar(2)];

-- Step 3: Eliminare la colonna originale
ALTER TABLE entrasp.nazioni DROP COLUMN rischio;

-- Step 4: Rinominare la colonna temporanea con il nome della colonna originale
ALTER TABLE entrasp.nazioni RENAME COLUMN rischio_temp TO rischio;

UPDATE entrasp.nazioni
SET rischio = null;

UPDATE entrasp.nazioni
SET rischio = COALESCE(array_append(rischio, 'B'), ARRAY['B'])
where cod_banca_italia in (8,9,12,21,28,29,32,40,50,54,55,61,67,68,77,86,92,94,101,105,257,258,259,260,261,275,276);

select cod_banca_italia, rischio
from entrasp.nazioni
where cod_banca_italia in (8,9,12,21,28,29,32,40,50,54,55,61,67,68,77,86,92,94,101,105,257,258,259,260,261,275,276);


UPDATE entrasp.nazioni
SET rischio = COALESCE(array_append(rischio, 'C'), ARRAY['C'])
where cod_banca_italia in (6,7,11,13,37,46,69,71,78,84,88,103,114,147,212,218,222,225,226,248,251,251,251,253,296);

UPDATE entrasp.nazioni
SET rischio = COALESCE(array_append(rischio, 'D'), ARRAY['D'])
where cod_banca_italia in (2,10,25,33,34,35,36,38,39,42,44,45,47,52,65,66,70,73,74,81,83,95,104,117,119,130,132,134,135,136,143,144,145,149,157,167,173,176,185,186,262,268,270,272,273,277,297);

UPDATE entrasp.nazioni
SET rischio = COALESCE(array_append(rischio, 'E'), ARRAY['E'])
where cod_banca_italia in (2,16,20,25,26,33,34,38,39,42,45,47,62,65,66,70,73,74,75,76,81,83,85,95,103,117,143,145,149,173,185,262,263,264,265,274,277,297,799);

select cod_banca_italia, rischio
from entrasp.nazioni
where cod_banca_italia in (2,16,20,25,26,33,34,38,39,42,45,47,62,65,66,70,73,74,75,76,81,83,85,95,103,117,143,145,149,173,185,262,263,264,265,274,277,297,799)
order by cod_banca_italia asc;

UPDATE entrasp.nazioni
SET rischio = COALESCE(array_append(rischio, 'F'), ARRAY['F'])
where cod_banca_italia in (23,33,44,47,51,112,120,121,131,148,154,161,189,197,198,209,216,221,222,249,262,269);

UPDATE entrasp.nazioni
SET rischio = COALESCE(array_append(rischio, 'G'), ARRAY['G'])
where cod_banca_italia in (20,39,65,74);

UPDATE entrasp.nazioni
SET rischio = COALESCE(array_append(rischio, 'H'), ARRAY['H'])
where cod_banca_italia in (2,27,34,39,42,51,57,62,65,74,78,82,83,102,117,118,119,120,121,132,134,142,145,149,152,238,239,240,241,242,243,244,297);

