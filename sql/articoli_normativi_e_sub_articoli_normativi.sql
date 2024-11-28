select an.id_testo_normativo, entrasp.testi_normativi_descr(an.id_testo_normativo) as descr_testo_normativo,
 an.ordinamento, an.codice_articolo_normativo, an.rubrica, an.id_articolo_normativo, an.id_articolo_normativo_parent, 
 entrasp.testi_normativi_rif_descr(ansub.id_articolo_normativo_rif) as Testo_normativo_sub,
entrasp.articoli_normativi_cod(ansub.id_articolo_normativo_rif) as cod_articolo_normativo, entrasp.articoli_normativi_cod_rub(ansub.id_articolo_normativo_rif) as articolo_normativo_foglia, 
ansub.id_articolo_normativo_rif as id_articolo_normativo_foglia
from entrasp.articoli_normativi an
left join entrasp.articoli_normativi_rif ansub
on an.id_articolo_normativo=ansub.id_articolo_normativo 
order by an.id_testo_normativo, an.codice_articolo_normativo, an.ordinamento
