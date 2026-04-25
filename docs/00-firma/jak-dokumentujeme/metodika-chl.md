---
title: "🎴 Metodika CHL (Cheatlist)"
sidebar_label: "Metodika CHL"
sidebar_position: 4
description: "Jak dělat rychlé karty — formát A4, tabulka vs. diagram, tisk, aktualizace"
category: law
layer: bimg
audience: [firma]
version: "1.0"
author: Jan Kutílek
date: 2026-04-14
---

# 🎴 Metodika CHL (Cheatlist) — jak dělat rychlé karty

CHL = **Cheatlist** (česky „tahák", „kartička"). Jednostránkové shrnutí pro rychlé připomenutí pod stresem nebo pro nováčka v prvním týdnu.

---

## 🎯 Účel

CHL odpovídá na otázku: *„Co mám rychle vědět?"*

Na rozdíl od SOP (který popisuje **postup**), CHL popisuje **stav, pravidla nebo mapu**. Není to „jak něco udělat", ale „kam se podívat / co si pamatovat".

---

## 👤 Adresát

- **Nováček v prvním týdnu** — ještě nic si nezapamatoval, potřebuje záchranný kruh.
- **Kdokoli pod stresem** — reklamace, výpadek, dovolená kolegy.
- **Člověk, který si potřebuje rychle vybavit** něco, co dělá jednou za čas.

:::note
CHL není náhrada SOP ani Big Image. Je to třetí vrstva — to, co zbude, když si z celé dokumentace uděláš výtah.
:::

---

## 📏 Pravidla

### 1. Vejde se na A4 (nebo 1 obrazovku)

Když se nevejde, **není to cheatlist**. Je to buď dlouhý SOP, nebo špatně zkrácená Big Image. Zkrať, nebo rozděl na dva CHL.

### 2. Forma = tabulka nebo diagram, ne souvislý text

- ✅ Tabulka „Kam co ukládám"
- ✅ Rozhodovací strom „Která kategorie?"
- ✅ Mapa teplot s barvami
- ❌ Odstavce vysvětlující, proč to tak je

Jestli chceš vysvětlovat, patří to do Big Image.

### 3. Žádná měkká slova

CHL musí být **jednoznačný**. Žádné „obvykle", „může být", „doporučujeme". Buď platí pravidlo, nebo nepatří do CHL.

### 4. Vizuální hierarchie

Nováček projede CHL očima za 10 sekund. Musí **vizuálně vidět** strukturu — barvy, ikony, tučné záhlaví sloupců. Ne zeď textu.

### 5. Aktualizace až jako poslední

CHL se píše **až když jsou hotové Big Image + SOP** a ukáže se, co lidé opravdu potřebují rychle. Předčasný CHL = vyhozená práce.

---

## 🏷️ Pojmenování a umístění

### Konvence názvu

`CHL_tema` — například: `CHL_Kam-co-ukladam`, `CHL_Teploty-a-archivace`, `CHL_Prvni-tyden-novacka`

Žádný AOR prefix — CHL obvykle překračují skupiny (slouží napříč).

### Umístění — dvojí existence

1. **V Mozkotron** — jako stránka v sekci „Cheatlists / Karty". Vždy aktuální.
2. **Vytištěné u stanic** — A4, laminované, pověšené vedle monitoru. Aktualizuje se při revizi Big Image.

Tištěná verze má **datum verze** v rohu, aby bylo vidět, jestli není zastaralá.

---

## 📐 Typy CHL a jejich šablony

### Typ 1: Tabulka „Kam co patří"

Klasická rozřazovací kartička.

| Typ dokumentu | Disk | Složka |
|---------------|------|--------|
| Nabídka | AOR5-PRODEJ | 01_provoz/Aktivní |
| Podepsaná smlouva | AOR5-PRODEJ | 04_zaznamy/Smlouvy |
| Reklamace | AOR5-PRODEJ | 01_provoz/Aktivní |
| Marketingová kampaň | AOR3-RUST | 02_rozvoj/Aktivní |
| Grafika k kampani | USE-GRAFIKA | AOR3-RUST |

### Typ 2: Rozhodovací strom

```
Je to dokument, co ty sám tvoříš a upravuješ?
├── ANO → Patří na AOR disk tvojí skupiny
│   ├── Je to formální neměnný doklad? → 04_zaznamy
│   ├── Je to rutinní operativa? → 01_provoz
│   ├── Je to projekt / změna? → 02_rozvoj
│   └── Je to analýza / report? → 03_analyzy
│
└── NE → Je to podklad, co jen používáš?
    ├── Grafika? → USE-GRAFIKA
    ├── Software / instalátor? → USE-SOFTWARE (jen IT)
    └── Faktura k zpracování? → USE-DOKLADY
```

### Typ 3: Mapa / diagram

Vizualizace struktury — teploty, vrstvy, pyramida. Příklad: barevný diagram 🔥/☀️/❄️/🪦 s popisem každé teploty a příkladem.

### Typ 4: Seznam pravidel

Pár jasných zásad, které platí vždy:

1. **Nikdy nesmaž archiv.** Staré ≠ nepotřebné.
2. **Nikdy nepřejmenuj složku v XPR disku.** Rozbije to automatizaci.
3. **Faktura v USE-DOKLADY není archiv** — finální je Money S4.
4. **Citlivé dokumenty nepatří na AOR0-COMMON.**
5. **Když nevíš, zeptej se** než přesuneš nebo smažeš.

---

## 🔄 Aktualizace CHL

CHL je **nejzávislejší** dokument — mění se pokaždé, když se změní cokoli nad ním (Big Image nebo SOP).

**Protokol při změně Big Image:**

1. Zreviduj všechny SOP.
2. Zreviduj všechny CHL.
3. Kde se změnilo, vytiskni nové verze a nahraď u stanic.
4. **Staré verze fyzicky sesbírej a vyhoď.** Jinak budou koexistovat dva zdroje pravdy.

---

## ✅ Checklist než CHL „vydáš"

- [ ] Vejde se na A4 / 1 obrazovku
- [ ] Forma = tabulka, diagram nebo krátký seznam (ne souvislý text)
- [ ] Žádná měkká slova („obvykle", „může")
- [ ] Má datum verze v rohu
- [ ] Vizuálně čitelné za 10 sekund
- [ ] Dal jsem to přečíst někomu, kdo systém nezná, a pochopil to
- [ ] Existuje i v Mozkotron (ne jen vytištěné)

---

## 💡 Příklady CHL, které v EK pravděpodobně vzniknou

| Téma | Typ | Kdo ho použije |
|------|-----|----------------|
| Kam co ukládám (mapa disků) | Tabulka | Každý zaměstnanec |
| Teploty dat a archivace | Diagram | Kdokoli, kdo archivuje |
| První týden nováčka | Seznam + odkazy | Nový zaměstnanec |
| Rozhodovací strom kategorie | Strom | Kdokoli tvořící dokument |
| 5 pravidel bezpečnosti | Pravidla | Každý |
| Nouzové postupy (výpadek) | Tabulka kontaktů + kroky | Při krizi |

---

*Nadřazená stránka: [📐 Model dokumentace](./model-dokumentace)*
*Sourozenci: [🧠 Metodika Big Image](./metodika-big-image) · [📋 Metodika SOP](./metodika-sop)*
