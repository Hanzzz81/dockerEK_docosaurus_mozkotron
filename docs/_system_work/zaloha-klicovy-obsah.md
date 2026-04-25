# Záloha klíčového obsahu — Mozkotron Content projekt

> **Účel:** Textová záloha podstatných informací z HTML pracovních souborů.
> Pokud se HTML soubory ztratí nebo poškodí, tenhle soubor obsahuje klíčová data.
>
> **Datum:** 2026-04-22

---

## 1. Dvouosý model v2.0 (R011, R017, R018, R019)

### Osa X — KATEGORIE (co čtenář hledá)

| Kód | Čtenář vidí | Otázka | Příklad |
|-----|-------------|--------|---------|
| `law` | 📜 Co platí | Co musím dodržet? | „Nosíš firemní oblečení při kontaktu se zákazníkem" |
| `proc` | 🔧 Jak to udělat | Jak to provedu? | „Výdej oblečení — kdo změří, kolik kusů, formulář" |
| `know` | 💡 Proč to tak je | Proč to dává smysl? | „Zákazník pozná zaměstnance, profesionalita, značka" |
| `mem` | 📝 Co se změnilo | Co se stalo a proč? | „Duben 2026: přidány softshellky místo vest" |

### Osa Y — VRSTVA (jak hluboký dokument)

| Kód | Název | Délka | Kdy vzniká |
|-----|-------|-------|------------|
| `bimg` | Big Image | Bez limitu, subpages povolené | Vždy jako první |
| `sop` | SOP (postup) | Bez limitu, řídí se tématem (R018) | Konkrétní postup per role |
| `chl` | Cheat List | 1–2 strany | Volitelně, zkrácená verze nad obsáhlejším SOP |

### Klíčové principy

- **Osy jsou nezávislé** — ze stejného tématu může být LAW BIMG + LAW SOP + KNOW BIMG
- **Zákon, ne zákon + novela (R019)** — dokument je vždy aktuální a kompletní. Žádné přílepky. Verzování.
- **MEM = žurnál** — deník rozhodnutí per tematický blok, ne samostatný dokument
- **České popisky pro čtenáře** — interní kódy ve frontmatter, čtenář vidí "Co platí", "Jak to udělat" atd.

---

## 2. Workflow tvorby obsahu — 10 kroků

0. **Podněty** — co spouští tvorbu (chyba z neznalosti, opakovaná otázka, nový proces, nové pravidlo, feedback, AOR audit)
1. **Trigger** — manažer (editor) rozhodl: téma potřebuje dokumentaci
2. **Kategorizace** — LAW / PROC / KNOW / MEM (rozhoduje editor s pomocí Clauda)
3. **Vstupy + artefakty** — téma, znalost, audience, podklady (fotky, screenshoty, video)
4. **Analýza** — Claude čte vstupy, ověřuje _structure.json, určuje AOR
5. **Rozhodnutí o vrstvách** — BIMG vždy, +SOP?, +CHL? (rozhoduje Claude, editor potvrzuje)
6. **Tvorba** — Claude píše obsah dle šablony a constraintů
7. **Review** — manažer kontroluje věcnost, srozumitelnost → schválí / vrátí / zamítne
8. **Publikace** — uložení .md, aktualizace registru, kaskádová revize
9. **Čtení** — zaměstnanec najde a provede (search, sidebar, QR, odkaz)
10. **Zpětná vazba** — chyba, nejasnost, chybí obsah → nový podnět → smyčka

### Předpoklady (mimo flow)
- Cowork session — editor připojí Synology folder
- Manifest (CLAUDE.md) — sdílená pravidla, vstupní brána pro Clauda

### Role
- **Editor (manažer)** — dodává potřebu + vstupy, schvaluje
- **Systém (manifest)** — centrální constrainty
- **Claude** — analyzuje, kategorizuje, tvoří, validuje, publikuje
- **Čtenář** — konzumuje obsah, dává feedback

---

## 3. Matice kategorie × vrstva — příklady z Elektro Kutílek

### LAW (Co platí)
- BIMG: Reklamační řád — lhůty, odpovědnosti, výjimky, eskalace
- SOP: Jak přijmout reklamaci na prodejně — 5 kroků v Money S4
- CHL: Reklamační lhůty — tabulka per typ zboží

### KNOW (Proč to tak je)
- BIMG: Proč máme firemní oblečení — profesionalita, rozpoznatelnost, značka
- SOP: Jak správně pečovat o firemní oblečení — praní, údržba
- CHL: Přehled typů oblečení per role — tabulka

### PROC (Jak to udělat)
- BIMG: Proces příjmu zboží — mechanický + administrativní pohled
- SOP: Naskladnění v Money S4 — kroky pro back office
- CHL: Kontrolní body při příjmu — rychlý checklist

### MEM (Co se změnilo)
- Žurnál per tematický blok — zaznamenává PROČ se něco změnilo
- Nemá vlastní SOP ani CHL — jde napříč jako deník

---

## 4. Výsledky z 21 scénářů — klíčové vzorce

### Formátové typy obsahu (4 typy)
1. **Markdown docs** (BIMG/SOP/CHL) — 11 z 21 scénářů
2. **Interaktivní průvodce** (HTML) — reklamace, DPH, org struktura
3. **Mikroaplikace** — uzávěrka, schvalování, katalog dodavatelů, marketing
4. **AI aplikace** — produktové portfolio s AI agregátorem

### Vzorec: dokumentace vs. aplikace
- U jednoduchých témat stačí BIMG + SOP
- U komplexních operativních témat se zodpovědnost přesouvá z dokumentu do aplikace
- Dokument popisuje "proč" a "jak ovládat aplikaci", aplikace řeší "jak dělat práci"
- Enforcement přes technologii, ne přes dokument (řidič neodjede bez podpisu v aplikaci)

### Systémové komponenty identifikované napříč scénáři
1. **Centrální plánovač rutin** — porady, údržba, BOZP, rutiny
2. **Úkolová + projektová aplikace** — delegace, onboarding, marketing
3. **Účelové databáze** — evidence vybavení, uzávěrkové záznamy, náklady
4. **Eskalační matice** — kdo co může rozhodnout, kam eskalovat
5. **ERP bridge** — Money S4 API pro čtení dat (ceny, sklady, kontakty)

---

## 5. Frontmatter kontrakt

### Povinná pole (vždy)
```yaml
title: "📜 Plný název"
sidebar_label: "Krátký label"
sidebar_position: 1
description: "Jedna věta"
category: law          # law | proc | know | mem
layer: bimg            # bimg | sop | chl
audience: [firma]      # array z AOR oblastí
version: "1.0"
author: Jan Kutílek
date: 2026-04-22
```

### Podmíněně povinné
```yaml
source_bimg: nazev-bimg    # POVINNÉ pro layer: sop a layer: chl
```

### Audience hodnoty
`firma` | `management` | `finance` | `rust` | `nakup` | `prodej` | `sluzby` | `technologie`

---

## 6. Naming konvence
- Soubory: `kebab-case-bez-diakritiky.md`
- Přípona layer: `nazev-bimg.md`, `nazev-sop.md`, `nazev-chl.md`
- Složky: stejné pravidlo, bez diakritiky
- Diakritika OK v `title` ve frontmatter

---

## 7. Seznam HTML pracovních souborů (přejmenováno 2026-04-22)

| Soubor | Obsah |
|--------|-------|
| `mozkotron-content_progress.html` | Progress dashboard s auto-refresh |
| `mozkotron-content_matice.html` | Vizuální matice kategorií × vrstev |
| `mozkotron-content_pruvodce-kategorie.html` | Interaktivní trénink — rozlišení LAW/PROC/KNOW/MEM |
| `mozkotron-content_workflow-diagram.html` | Workflow — dvousloupcový list-style přehled |
| `mozkotron-content_workflow-vyvojak.html` | Workflow — vizuální vývojový diagram s popupy |
| `mozkotron-content_workflow-tvorba.html` | Workflow — tvorba obsahu s constrainty |

---

*Záloha vytvořena 2026-04-22*
