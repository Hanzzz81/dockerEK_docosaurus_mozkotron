---
title: "🔴 XPR disky"
sidebar_label: "XPR disky"
sidebar_position: 4
description: "Strojové disky — 4 podtypy, konvence číslování, bezpečnostní logika"
category: law
layer: bimg
audience: [technologie]
version: "1.0"
author: Jan Kutílek
date: 2026-04-13
---

# 🔴 XPR disky — detail

**Režim:** SMB nebo Drive podle potřeby procesu. „Používá to stroj."

:::danger Bezpečnostní pravidlo
XPR disky se **nepřipojují uživatelům jako jednotky**. Chrání se integrita cest — kdyby někdo přejmenoval složku nebo přesunul soubor, rozbije tím strojový proces.
:::

---

## Podtypy XPR disků

| Podtyp | Účel |
|--------|------|
| **Bootstrap** | Mechanismus připojení ostatních disků |
| **Sync** | Synchronizace konfigurace mezi stanicemi |
| **Datový styčný bod** | Vstup/výstup pro strojový proces |
| **Infrastruktura** | Zálohy, systémová údržba |

---

## Seznam disků (7 aktuálních + 1 budoucí)

| # | Disk | Režim | Vlastník | Podtyp | Účel |
|---|------|-------|----------|--------|------|
| 1 | XPR0_USER_SCRIPTS | Drive | Všichni (per-user folder) | Bootstrap | Nultý disk — skript připojuje ostatní disky. Každý user má svůj folder. |
| 2 | XPR0_PRINT_CARD | Drive | Všichni | Sync | Synchronizace popisek mezi stanicemi |
| 3 | XPR0_ROYAL_TS | Drive | Všichni | Sync | Synchronizace RDP připojení |
| 4 | XPR2_BANKY | Drive | Finance | Datový styčný bod | Výměna dat banking ↔ Money S4 |
| 5 | XPR4_IMPORTY | — | Nákup | Datový styčný bod | Importy dat do Money S4 |
| 6 | XPR6_BACKUPS | SMB | Technologie | Infrastruktura | Automatizované zálohy |
| 7 | XPR6_VEEAM | SMB | Technologie | Infrastruktura | Veeam zálohy |
| 8 | XPR6_PROJECTS | Drive | Technologie | Datový styčný bod | Teco/Jablotron nativní projekty, sync mezi stanicemi IT |
| 🔮 | *(budoucí)* XPR_ESHOP | — | — | Datový styčný bod | Až se nahradí přímé SQL příkazy |

---

## Konvence číslování XPR disků

Prefix = AOR skupina procesního vlastníka:

| Prefix | Skupina |
|--------|---------|
| `XPR0_` | Společné / infrastrukturní (všichni nebo kdokoli) |
| `XPR2_` | Finance |
| `XPR3_` | Růst / Marketing |
| `XPR4_` | Nákup |
| `XPR5_` | Prodej |
| `XPR6_` | Technologie |

Tím z názvu okamžitě poznáš, kdo je procesní vlastník daného disku.

---

## Proč XPR nejsou mountnuté uživatelům

Strojové procesy očekávají konkrétní cesty k souborům. Kdyby uživatel viděl disk jako normální písmeno a:

- přejmenoval složku,
- přesunul soubor,
- smazal něco, co „vypadalo jako smetí",

…rozbije tím běžící automatizaci. Skript neví, že něco uživatel přepákoval.

Proto jsou XPR disky přístupné **jen procesu** (pod strojovým účtem) a uživatelé s nimi nemají jak manipulovat přes Průzkumník. IT admin má přístup mimo běžný workflow (přes Synology DSM nebo jako service account).

---

*Nadřazená stránka: [🗄️ Disková architektura](./diskova-architektura)*
