---
title: "🟡 USE disky"
sidebar_label: "USE disky"
sidebar_position: 3
description: "3 USECASE disky — USE-GRAFIKA, USE-SOFTWARE, USE-DOKLADY"
category: law
layer: bimg
audience: [technologie]
version: "1.0"
author: Jan Kutílek
date: 2026-04-13
---

# 🟡 USE disky — detail

**Režim:** SMB nebo Drive, sdílené **per uživatel** (ne skupinové). „Používám to."

---

## Seznam disků (3 kusy)

| # | Disk | Režim | Přístup | Účel |
|---|------|-------|---------|------|
| 1 | USE-GRAFIKA | SMB | Per AOR skupina | Grafické podklady |
| 2 | USE-SOFTWARE | SMB | Jen Technologie (IT) | Admin nástroje, instalátory |
| 3 | USE-DOKLADY | Drive | Finance + Nákup per-user | Průtokový disk faktur |

---

## USE-GRAFIKA

Grafické podklady pro výrobu vizuálů — velké binární soubory (PSD, AI, STL, TIFF). SMB, protože nepotřebuje sync.

**Root členěn per AOR skupina** (kdo je za daný typ grafiky zodpovědný):

```
USE-GRAFIKA/
├── AOR3-RUST/           ← marketing, billboardy, FB, POS, brand
├── AOR5-PRODEJ/         ← POS materiály, štítky do skladu
├── AOR6-TECHNOLOGIE/    ← popisky na stroje, 3D tisk, funkční výrobky
└── COMMON/              ← sdílené brand materiály (logo, šablony)
```

**Propojení s AOR disky:** Když projekt „Billboardy 2026" potřebuje Excel kalkulaci (AOR3-RUST/02_rozvoj) + PSD zdrojáky (USE-GRAFIKA/AOR3-RUST), propojují se buď:

- shodnou pojmenovací konvencí (stejný název podsložky na obou místech), nebo
- přes Mozkotron stránku projektu s odkazy na obě místa.

---

## USE-SOFTWARE

Uzavřený disk pro IT správce. Plný rozsah instalátorů, image stanic, admin nástroje.

```
USE-SOFTWARE/
├── Instalatory/         ← plný rozsah, i starší verze
├── Image/               ← image stanic, PXE
├── Nastroje/            ← diagnostika, monitoring
└── Nastaveni/           ← konfigurace, exporty
```

**Přístup:** Jen skupina Technologie.

---

## USE-DOKLADY

**Průtokový/staging disk** — není to archiv dokladů. Faktury se sem ručně nahrají, zpracují, připnou do Money S4 jako databázová příloha. **Finální uložení dokladů je v Money S4, ne tady.**

```
USE-DOKLADY/
├── FP1/                 ← typ faktury 1
├── FP2/                 ← typ faktury 2
├── FP3/                 ← typ faktury 3
└── FP4/                 ← typ faktury 4
```

**Přístup:** Finance (režijní faktury) + Nákup (zbožové faktury, kusové dobropisy), per-user.

:::note Proč USE a ne AOR
Doklad tu jen protéká. Po zpracování zmizí do Money S4. Není to živá pracovní oblast, je to podkladiště pro jednotlivce.
:::

---

*Nadřazená stránka: [🗄️ Disková architektura](./diskova-architektura)*
