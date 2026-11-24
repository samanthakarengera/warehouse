# Analyse Warehouse API

## Entiteiten en relaties

- **User**: iemand met een account. Elke user heeft precies één rol: customer, warehouse of manager.
- **Category**: een groep producten (bv. "Laptops"). Een category heeft veel producten; een product hoort bij precies één category.
- **Product**: een artikel met naam, prijs en voorraad. Een product heeft veel reviews en kan in veel orderregels voorkomen.
- **Review**: een beoordeling (score en tekst) van één user over één product. Een user kan veel reviews schrijven, een product kan veel reviews hebben.
- **Order**: een bestelling van één user (customer). Een order heeft een status (`pending`, `confirmed`, `cancelled`) en bestaat uit één of meer orderregels.
- **OrderItem**: een orderregel die één order koppelt aan één product, met aantal en prijs op het moment van bestellen. Dit is de koppeltabel tussen Order en Product (veel-op-veel).

Samengevat: User 1-n Order, Order 1-n OrderItem, Product 1-n OrderItem, Category 1-n Product, Product 1-n Review, User 1-n Review.

## Rollen

- **customer**: koopt producten en volgt zijn eigen orders.
- **warehouse**: beheert de fysieke voorraad.
- **manager**: beheert gebruikers, orders en voorraad.

## Matrix: wie mag wat

| Actie | anoniem | customer | warehouse | manager |
|---|:-:|:-:|:-:|:-:|
| Profiel aanmaken (registreren) | ✔ | | | |
| Inloggen | ✔ | ✔ | ✔ | ✔ |
| Voorraad/producten bekijken | | ✔ | ✔ | ✔ |
| Voorraad aanpassen | | | ✔ | ✔ |
| Order plaatsen | | ✔ | | |
| Eigen orders bekijken | | ✔ | | ✔ (alle) |
| Order wijzigen | | | | ✔ |
| Order annuleren | | ✔ (eigen, enkel `pending`) | | ✔ |
| Profielen bekijken | | | | ✔ |
| Rollen uitgeven | | | | ✔ |

## Endpoints

Alle endpoints behalve register en login vereisen een geldige JWT in de header `Authorization: Bearer <token>`. Foutmeldingen hebben altijd de vorm `{ "error": "tekst" }`.

| # | Methode | Pad | Wie | Body | Response | Statuscodes |
|---|---|---|---|---|---|---|
| 1 | POST | `/api/auth/register` | anoniem | `{ "name", "email", "password" }` | `{ "id", "name", "email", "role": "customer" }` | 201 aangemaakt; 400 ongeldige invoer; 409 e-mail bestaat al |
| 2 | POST | `/api/auth/login` | anoniem | `{ "email", "password" }` | `{ "token", "user": { "id", "name", "role" } }` | 200 ok; 400 ontbrekende velden; 401 fout wachtwoord of onbekende user |
| 3 | GET | `/api/products` | ingelogd | geen (optioneel `?categoryId=`) | `[ { "id", "name", "price", "stock", "categoryId" } ]` | 200 ok; 401 geen/ongeldige token; 400 ongeldige query |
| 4 | GET | `/api/products/:id` | ingelogd | geen | `{ "id", "name", "price", "stock", "category" }` | 200 ok; 401 niet ingelogd; 404 product bestaat niet |
| 5 | PATCH | `/api/products/:id/stock` | warehouse, manager | `{ "stock": 25 }` | `{ "id", "stock" }` | 200 ok; 400 negatief of geen getal; 401 niet ingelogd; 403 verkeerde rol; 404 product niet gevonden |
| 6 | POST | `/api/orders` | customer | `{ "items": [ { "productId", "quantity" } ] }` | `{ "id", "status": "pending", "items": [...], "total" }` | 201 aangemaakt; 400 lege of ongeldige items; 401 niet ingelogd; 403 geen customer; 404 product bestaat niet; 409 onvoldoende voorraad |
| 7 | GET | `/api/orders` | customer (eigen), manager (alle) | geen | `[ { "id", "status", "total", "userId" } ]` | 200 ok; 401 niet ingelogd; 403 warehouse heeft geen toegang |
| 8 | GET | `/api/orders/:id` | customer (eigen), manager | geen | `{ "id", "status", "items": [...], "total" }` | 200 ok; 401 niet ingelogd; 403 order van iemand anders; 404 niet gevonden |
| 9 | PATCH | `/api/orders/:id` | manager | `{ "items": [...] }` of `{ "status": "confirmed" }` | bijgewerkte order | 200 ok; 400 ongeldige invoer; 401 niet ingelogd; 403 geen manager; 404 niet gevonden; 409 order is al geannuleerd |
| 10 | POST | `/api/orders/:id/cancel` | customer (eigen), manager | geen | `{ "id", "status": "cancelled" }` | 200 ok; 401 niet ingelogd; 403 order van iemand anders; 404 niet gevonden; 409 kan niet meer geannuleerd worden |
| 11 | GET | `/api/users` | manager | geen | `[ { "id", "name", "email", "role" } ]` | 200 ok; 401 niet ingelogd; 403 geen manager |
| 12 | PATCH | `/api/users/:id/role` | manager | `{ "role": "warehouse" }` | `{ "id", "role" }` | 200 ok; 400 ongeldige rol; 401 niet ingelogd; 403 geen manager; 404 user niet gevonden |

Extra (projectstap 1): `GET /api/health` geeft `200 { "status": "ok" }` en vereist geen login.

Reviews en categorieën krijgen eigen endpoints in een latere module; ze zitten al wel in het datamodel.