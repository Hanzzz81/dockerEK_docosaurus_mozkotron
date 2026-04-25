---
title: "🗄️ Disková architektura Synology"
sidebar_label: "Přehled architektury"
sidebar_position: 1
description: "Návrh shared folders na Synology NAS — tři typy disků, mapování na taxonomii"
category: law
layer: bimg
audience: [technologie]
version: "1.0"
author: Jan Kutílek
date: 2026-04-13
---

# 🗄️ Disková architektura Synology

:::info
**📜 LAW** · v1.0 · 👤 Jan Kutílek · 📅 2026-04-13

Návrh shared folders na Synology NAS (DS1817+). Navazuje na [Datový zákon](../law-obecne/datovy-zakon) a [Taxonomii dat](../law-obecne/taxonomie).
:::

Tato stránka je **rozcestník a principy**. Detaily jednotlivých typů disků jsou v subpage.

---

## 🎯 Tři typy disků = tři režimy práce

| Typ | Režim | Princip | Sdílení | Přístup |
|-----|-------|---------|---------|---------|
| 🟢 **AOR** | „Pracuju s tím" | Živý pracovní prostor — tvořím, upravuju, rozhoduju | **Po skupinách** | Synology Drive |
| 🟡 **USE** | „Používám to" | Podkladiště — beru si, použiju, neřeším obsah | **Per uživatel** | SMB nebo Drive |
| 🔴 **XPR** | „Používá to stroj" | Strojový styčný bod — lidi nemají přístup | **Strojový proces** | SMB nebo Drive, skrytý |

:::warning Klíčové pravidlo
XPR disky nejsou připojené jako jednotky běžným uživatelům — chrání se integrita cest (kdyby někdo přejmenoval složku, rozbije tím strojový proces).
:::

---

## 📊 Celkový přehled

| Typ | Počet | Režim sdílení | Princip |
|-----|-------|---------------|---------|
| 🟢 AOR | 7 (0–6) | Po skupinách | „Pracuju s tím" |
| 🟡 USE | 3 | Per uživatel | „Používám to" |
| 🔴 XPR | 7 + 1 budoucí | Per proces (skrytý) | „Používá to stroj" |
| **Celkem** | **17 + 1** | | |

---

## ⚙️ Technologické důvody členění

Disky jsou rozděleny takto ze čtyř důvodů (ne z rozmaru):

1. **Zálohování** — každý disk má jinou zálohovací politiku (AOR často, USE-SOFTWARE nikdy).
2. **Verzování** — někde detailní, někde vypnuté (velké binární soubory by verzování žralo místo).
3. **Práva** — snazší spravovat celý disk než jednotlivé adresáře uvnitř.
4. **Sync režim** — AOR = Drive (sync na lokál, offline práce), USE = většinou SMB (velké soubory, online), XPR = podle procesu.

Detaily zálohovacích a verzovacích politik se řeší v samostatném bodě Fáze 1.

---

## 🔗 Mapování na taxonomii (10 kategorií)

| Kategorie | Kam na Synology |
|-----------|-----------------|
| 📝 WRK (práce) | AOR disk / 01_provoz nebo 02_rozvoj |
| 📑 REC (záznamy) | AOR disk / 04_zaznamy (vlastní skupiny) nebo USE-DOKLADY (cross-group faktury) |
| 📊 ANA (analytika) | AOR disk / 03_analyzy |
| 🎨 KIT (firemní materiály) | USE-GRAFIKA (grafické podklady), AOR0-COMMON/Sablony (tiskové šablony) |
| 📚 REF (referenční data) | USE-SOFTWARE (pro IT), AOR0-COMMON (uživatelské instalátory) |
| 🤖 XPR (strojová data) | XPR disky (podle procesu) |

LAW, SOP, KNOW, MEM — žijí v Mozkotron, ne na Synology.

---

## 🚫 Mimo datový OS

| Co | Proč | Stav |
|----|------|------|
| Osobní Synology Drive (per user) | Pracovní stůl jednotlivce, ne firemní systém | Existuje, neřešíme |
| Média (video / music / photo) | Interní NAS služby, DLNA streamování | Mimo datový OS |

---

## 📖 Detaily podle typu disku

- **[AOR disky](./aor-disky)** — 7 disků pro pracovní prostor skupin, root struktura, AOR0-COMMON
- **[USE disky](./use-disky)** — USE-GRAFIKA, USE-SOFTWARE, USE-DOKLADY
- **[XPR disky](./xpr-disky)** — 4 podtypy, seznam, konvence číslování, bezpečnostní logika

---

## 📎 Otevřené body k dořešení (ne v této fázi)

- Zálohovací strategie per typ disku (Fáze 1, bod: zálohy)
- Verzovací strategie per typ disku (Fáze 1, bod: verzování)
- Konvence pojmenování složek a souborů uvnitř disků (Fáze 5: konvence)
- Propojení AOR ↔ USE-GRAFIKA přes Mozkotron nebo shodnou konvenci (Fáze 3: propojení)
- XPR_ESHOP — až se nahradí přímé SQL
- USE-SOFTWARE detailní obsah kategorií (Fáze 7: migrace)

---

*Navazuje na: [📜 Datový zákon](../law-obecne/datovy-zakon) · [🧬 Taxonomie dat](../law-obecne/taxonomie)*
*Vlastník: Jan Kutílek · 2026-04-13*
