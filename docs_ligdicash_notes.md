# Notes d’intégration LigdiCash

Source consultée : https://developers.ligdicash.com/api1/payin-redirection

## Payin avec redirection

Endpoint de création de facture : `POST https://app.ligdicash.com/pay/v01/redirect/checkout-invoice/create`.

Headers obligatoires :

| Header | Valeur attendue |
|---|---|
| `Apikey` | API Key du projet LigdiCash |
| `Authorization` | `Bearer <API_TOKEN>` |
| `Accept` | `application/json` |
| `Content-Type` | `application/json` |

Body attendu : objet racine `commande` contenant `invoice`, `store`, `actions` et `custom_data`. La devise doit être `XOF`. `callback_url` doit pointer vers un endpoint backend qui reçoit les détails de transaction. `custom_data.transaction_id` peut contenir l’identifiant transaction interne.

Réponse de création : si `response_code` vaut `00`, `response_text` contient l’URL de paiement et `token` contient l’identifiant/token de transaction à conserver pour vérification ultérieure.

Endpoint de confirmation : `GET https://app.ligdicash.com/pay/v01/redirect/checkout-invoice/confirm/?invoiceToken={token}` avec les mêmes headers d’authentification.

Principe sécurité : le frontend ne doit jamais activer l’abonnement. L’activation doit se faire côté backend après callback et/ou confirmation LigdiCash réussie.
