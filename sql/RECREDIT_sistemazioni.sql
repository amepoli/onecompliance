-- query per individuare pagamenti doppi in fase di acquisto (parità di codice_azienda, id_Cessione,id_argomento_tipo_pag, importo)
select codice_azienda, id_Cessione,id_argomento_tipo_pag, importo, id_pagamento
from entrasp.pagamenti_Crediti
	where codice_azienda||'-'||id_Cessione||'-'||id_argomento_tipo_pag||'-'||importo in
(select codice_azienda||'-'||id_Cessione||'-'||id_argomento_tipo_pag||'-'||importo 
	from entrasp.pagamenti_crediti
	where id_argomento_tipo_pag=51486
group by codice_azienda, id_Cessione,id_argomento_tipo_pag, importo
having count(id_pagamento)>1)
order by codice_azienda, id_cessione, id_pagamento;


-- query per eliminare pagamenti doppi in fase di acquisto (parità di codice_azienda, id_Cessione,id_argomento_tipo_pag, importo)

WITH cte AS (
    SELECT *
    FROM (
        SELECT id_pagamento, id_cessione,
               ROW_NUMBER() OVER (PARTITION BY codice_azienda, id_cessione, id_argomento_tipo_pag, importo ORDER BY id_pagamento DESC) AS rnum
        FROM entrasp.pagamenti_crediti
        WHERE id_argomento_tipo_pag = 51486
    ) t
    WHERE t.rnum > 1
    ORDER BY id_cessione ASC
    LIMIT 400
)
DELETE FROM entrasp.pagamenti_crediti
WHERE id_pagamento IN (SELECT id_pagamento FROM cte);


-- query per creare l'indice univoco
CREATE UNIQUE INDEX idx_unique_pagamenti_crediti ON entrasp.pagamenti_crediti (codice_azienda, id_cessione, id_argomento_tipo_pag)
WHERE id_argomento_tipo_pag = 51486;


/*

SELECT id_cessione, codice_azienda, data_pagamento
FROM entrasp.crediti_ceduti cc
WHERE data_pagamento IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM entrasp.pagamenti_crediti pc
    WHERE pc.id_cessione = cc.id_cessione
    AND pc.codice_azienda = cc.codice_azienda
    AND pc.id_argomento_tipo_pag IN (51489, 51488, 50664) 
)
and codice_azienda='RE-CREDIT'
	and id_cessione=56571



SELECT entrasp.crediti_ceduti_aggiorna(codice_azienda, id_cessione)
FROM entrasp.crediti_ceduti cc
WHERE data_pagamento IS NOT NULL
AND NOT EXISTS (
    SELECT 1
    FROM entrasp.pagamenti_crediti pc
    WHERE pc.id_cessione = cc.id_cessione
    AND pc.codice_azienda = cc.codice_azienda
    AND pc.id_argomento_tipo_pag IN (51489, 51488, 50664) and codice_azienda='RE-CREDIT'
)
and codice_azienda='RE-CREDIT'
	and id_cessione=51844;


-- query per trovare crediti senza pagamenti
SELECT id_cessione, codice_azienda, data_pagamento
FROM entrasp.crediti_ceduti cc
WHERE NOT EXISTS (
    SELECT 1
    FROM entrasp.pagamenti_crediti pc
    WHERE pc.id_cessione = cc.id_cessione
    AND pc.codice_azienda = cc.codice_azienda
)
and codice_azienda='RE-CREDIT'
*/

-- query per trovare incoerenze nei segni delle fatture
select distinct case when importo<0 then 'negativo' else 'positivo' end as segno_importo, 
	id_argomento_tipo_pag, 
	entrasp.argomenti_descr_breve(id_argomento_tipo_pag),
	count(id_pagamento)
from entrasp.pagamenti_crediti
where codice_azienda='RE-CREDIT'
and importo!=0
group by case when importo<0 then 'negativo' else 'positivo' end, 
	id_argomento_tipo_pag
order by id_argomento_tipo_pag

-- serie di quattro query per correggere segni anomali nei pagamenti (movimenti crediti)
select * from entrasp.pagamenti_crediti
where importo<0 and id_argomento_tipo_pag=51488;

update entrasp.pagamenti_crediti
set importo=-importo
where importo<0 and id_argomento_tipo_pag=50664;

update entrasp.pagamenti_crediti
set importo=-importo
where importo>0 and id_argomento_tipo_pag=51486;



select max(id_pagamento)
from entrasp.pagamenti_crediti
where codice_azienda='RE-CREDIT'

-- query per inserire pagamenti per fatture senza movimenti. Si potrebbe anche pensare di inserirla nella query di import delle fatture	
INSERT INTO entrasp.pagamenti_crediti(
	id_cessione, codice_azienda, id_pagamento, data_pagamento, importo, id_argomento_tipo_pag, id_controparte, tasso)
SELECT 
    id_cessione, 
    codice_azienda, 
    110849+ ROW_NUMBER() OVER (ORDER BY id_cessione) AS rownum, 
    coalesce(data_acquisto, data_fattura, '1900-01-01'), 
    -ABS(importo), 
    51486, 
    id_cedente, 
    case when interessi_non_dovuti='1' then 0 else 0.08 end 
from entrasp.crediti_ceduti cc
WHERE 
    NOT EXISTS (
        SELECT 1
        FROM entrasp.pagamenti_crediti pc
        WHERE pc.id_cessione = cc.id_cessione
        AND pc.codice_azienda = cc.codice_azienda
    )
    AND codice_azienda = 'RE-CREDIT';

-- importi crediti non coerenti
select id_Cessione, codice_azienda, importo, capitale_residuo, capitale_residuo_leg
from entrasp.crediti_ceduti
where (abs(capitale_residuo)> abs(importo)) or (abs(capitale_residuo_leg)> abs(importo))

select entrasp.sposta_nc_nei_pagamenti('RE-CREDIT', 53831)

select id_cessione, data_pagamento, codice_azienda, capitale_residuo_leg
from entrasp.crediti_ceduti
where codice_azienda='RE-CREDIT' and id_cessione=17104

-- cessioni per cedente da crediti_ceduti
select id_cedente, codice_part, entrasp.anagrafiche_cognnome(codice_part, id_cedente), entrasp.anagrafiche_piva_cf(codice_part, id_cedente), count(id_cessione) 
from entrasp.crediti_ceduti
where codice_azienda='RE-CREDIT'	
group by id_cedente, codice_part
order by codice_part, count(id_cessione) desc

--- pagamenti per cedente
select cc.id_cedente, cc.codice_part, entrasp.anagrafiche_cognnome(cc.codice_part, cc.id_cedente), entrasp.anagrafiche_piva_cf(cc.codice_part, cc.id_cedente), count(pc.id_pagamento), sum(pc.importo) 
from entrasp.crediti_ceduti cc
inner join entrasp.pagamenti_crediti pc using (codice_azienda, id_cessione)	
where cc.codice_azienda='RE-CREDIT' and pc.data_pagamento<'2024-04-23'
group by cc.id_cedente, cc.codice_part
order by cc.codice_part, sum(pc.importo) desc


--- dettaglio pagamenti per cedente
select pc.id_pagamento, cc.id_cessione, cc.id_cedente, cc.codice_part, cc.n_fattura, entrasp.anagrafiche_cognnome(cc.codice_part, cc.id_cedente), entrasp.anagrafiche_piva_cf(cc.codice_part, cc.id_cedente), pc.data_pagamento, pc.importo 
from entrasp.crediti_ceduti cc
inner join entrasp.pagamenti_crediti pc using (codice_azienda, id_cessione)	
where cc.codice_azienda='RE-CREDIT' and pc.data_pagamento>='2022-01-01'
--	and cc.id_cedente in(30, 36, 37, 38, 41, 62, 75, 80, 162, 163, 184, 185, 191, 209)
order by pc.data_pagamento desc


select pc.id_pagamento, cc.id_cessione, cc.id_cedente, cc.codice_part, cc.n_fattura, entrasp.anagrafiche_cognnome(cc.codice_part, cc.id_cedente), entrasp.anagrafiche_piva_cf(cc.codice_part, cc.id_cedente), pc.data_pagamento, pc.importo from entrasp.crediti_ceduti cc inner join entrasp.pagamenti_crediti pc using (codice_azienda, id_cessione) where cc.codice_azienda='RE-CREDIT'

	
	
select cc.codice_azienda, cc.id_cessione, capitale_residuo_leg, data_pagamento
from entrasp.crediti_ceduti cc
where cc.codice_azienda||cc.id_cedente
in (select distinct cc2.codice_azienda||cc2.id_cedente	
from entrasp.crediti_ceduti cc2
where cc2.codice_azienda='RE-CREDIT'
group by cc2.id_cedente, cc2.codice_azienda
	having count(cc2.id_cessione) between 21 and )

SET session_replication_role = replica;	
select entrasp.crediti_ceduti_aggiorna(cc.codice_azienda, cc.id_cessione)
from entrasp.crediti_ceduti cc
where cc.codice_azienda||cc.id_cedente
in (select distinct cc2.codice_azienda||cc2.id_cedente	
from entrasp.crediti_ceduti cc2
where cc2.codice_azienda='RE-CREDIT'
group by cc2.id_cedente, cc2.codice_azienda
	having count(cc2.id_cessione) between 1401 and 1800);
SET session_replication_role = DEFAULT;

select entrasp.crediti_ceduti_aggiorna(tab.codice_azienda, tab.id_cessione)
from

select id_cessione, count (id_pagamento)
from entrasp.pagamenti_crediti
	where data_pagamento>'2023-01-01'
	group by id_cessione,
	order by count (id_pagamento) desc
	
select distinct cc.codice_azienda, cc.id_cessione, capitale_residuo, importo, capitale_residuo_leg, data_pagamento
from entrasp.crediti_ceduti cc
where cc.codice_azienda||cc.id_cedente
in (select distinct cc2.codice_azienda||cc2.id_cedente	
from entrasp.crediti_ceduti cc2
where cc2.codice_azienda='RE-CREDIT'
group by cc2.id_cedente, cc2.codice_azienda
	having count(cc2.id_cessione) <10)

SET session_replication_role = replica;	
select entrasp.pag_crediti_aggiorna(codice_axienda, id_cessione, max (id_pagamento)
from entrasp.pagamenti_crediti
	where data_pagamento>'2023-01-01'
	group by id_cessione
	order by count (id_pagamento) desc
SET session_replication_role = DEFAULT;
codiceazienda, idpagamento)

select id_cessione, count (id_pagamento)
from entrasp.pagamenti_crediti
	where data_pagamento>'2023-01-01'
	group by id_cessione
	order by count (id_pagamento) desc

SET session_replication_role = replica;	
select entrasp.pag_crediti_aggiorna( codice_azienda, max (id_pagamento))
from entrasp.pagamenti_crediti
	where data_pagamento>'2024-04-10'
	group by codice_azienda, id_cessione
	order by count (id_pagamento) desc
SET session_replication_role = DEFAULT;

select codice_azienda, id_cessione, max (id_pagamento)
from entrasp.pagamenti_crediti
	where data_pagamento>'2024-04-10'
	group by codice_azienda, id_cessione
	order by count (id_pagamento) desc


-- query per trovare i crediti con capitale a 0
select entrasp.pag_crediti_aggiorna(pc.codice_azienda, pc.id_pagamento) 
from	
(SELECT
	ID_CESSIONE,
	codice_azienda
FROM
	ENTRASP.CREDITI_CEDUTI cc
WHERE
	CODICE_AZIENDA = 'RE-CREDIT'
	AND cc.CODICE_AZIENDA || '-' || cc.ID_CESSIONE NOT IN (
		SELECT
			PAG.CODICE_AZIENDA || '-' || PAG.ID_CESSIONE
		FROM
			ENTRASP.PAGAMENTI_CREDITI PAG
		WHERE
			PAG.ID_ARGOMENTO_TIPO_PAG IN (51488, 51489, 50664)
	)) t1
	left join
(SELECT
    ID_CESSIONE,
   codice_azienda
FROM
    ENTRASP.CREDITI_CEDUTI cc
WHERE
    CODICE_AZIENDA = 'RE-CREDIT'
   and capitale_Residuo_leg=0) t2
	on t1.codice_azienda=t2.codice_azienda and t1.id_cessione=t2.id_cessione
inner join entrasp.pagamenti_Crediti pc on t1.codice_azienda=pc.codice_azienda and t1.id_cessione=pc.id_Cessione
	where t2.id_cessione is null limit 10

----
	select pc.id_Cessione, pc.codice_azienda, pc.id_pagamento 
from	
(SELECT
	ID_CESSIONE,
	codice_azienda
FROM
	ENTRASP.CREDITI_CEDUTI cc
WHERE
	CODICE_AZIENDA = 'RE-CREDIT'
	AND cc.CODICE_AZIENDA || '-' || cc.ID_CESSIONE NOT IN (
		SELECT
			PAG.CODICE_AZIENDA || '-' || PAG.ID_CESSIONE
		FROM
			ENTRASP.PAGAMENTI_CREDITI PAG
		WHERE
			PAG.ID_ARGOMENTO_TIPO_PAG IN (51488, 51489, 50664)
	)) t1
	left join
(SELECT
    ID_CESSIONE,
   codice_azienda
FROM
    ENTRASP.CREDITI_CEDUTI cc
WHERE
    CODICE_AZIENDA = 'RE-CREDIT'
   and capitale_Residuo_leg=0) t2
	on t1.codice_azienda=t2.codice_azienda and t1.id_cessione=t2.id_cessione
inner join entrasp.pagamenti_Crediti pc on t1.codice_azienda=pc.codice_azienda and t1.id_cessione=pc.id_Cessione
	where t2.id_cessione is null 
	

select entrasp.pag_crediti_aggiorna('RE-CREDIT', 965)


select * from entrasp.mandati mn
where not exists(select 1 from entrasp.pagamenti_crediti pc
	where mn.codice_azienda=pc.codice_azienda and mn.id_mandato=pc.id_mandato)	
	and codice_azienda='RE-CREDIT'
