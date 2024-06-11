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
												AND codice_part = 'FININT'
												
								)
		WHERE vc.tipo_legame IN ('A','M')
				AND coalesce(trim(vc.rete,'0'),'') != '7'
				AND vc.data_verifica != '0'
				AND cnt.codice_azienda = 'FININTSGR'
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
			

				AND entrasp.is_expired_profile('FININTSGR',cnt.id_cliente)
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