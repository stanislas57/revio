# Base des établissements

La table `schools` (lycées, universités, écoles) est chargée par la migration `20261126110100_schools_data.sql`,
**générée** — ne pas la modifier à la main.

Sources (Licence Ouverte Etalab 2.0) :

- Annuaire de l'éducation, Ministère de l'Éducation nationale (`fr-en-annuaire-education`) : lycées ouverts ;
- Principaux établissements d'enseignement supérieur, Ministère de l'Enseignement supérieur
  (`fr-esr-principaux-etablissements-enseignement-superieur`) : universités, écoles, grands établissements.

Limites : pas de CFA, de BTS hors lycée ni de petites écoles privées. Un établissement manquant n'empêche rien
(le choix est facultatif).

## Mettre à jour

```bash
curl -o /tmp/lycees.json 'https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/exports/json?select=identifiant_de_l_etablissement,nom_etablissement,type_etablissement,statut_public_prive,code_postal,nom_commune,libelle_departement,voie_generale,voie_technologique,voie_professionnelle,lycee_agricole,etat&where=type_etablissement%20in%20(%27Lyc%C3%A9e%27,%27Lyc%C3%A9e%20professionnel%27)'
curl -o /tmp/sup.json 'https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-principaux-etablissements-enseignement-superieur/exports/json?select=uai,uo_lib,sigle,type_d_etablissement,secteur_d_etablissement,com_nom,dep_nom'
node scripts/build-schools-migration.mjs /tmp/lycees.json /tmp/sup.json supabase/migrations/<nouvel horodatage>_schools_data.sql
```

Ne jamais modifier une migration déjà fusionnée : une mise à jour est une **nouvelle** migration (le script
utilise `on conflict (id) do nothing` ; prévoir un `update` pour les établissements renommés).
