---
title: "📐 Model tvorby dokumentace"
sidebar_label: "Model dokumentace"
sidebar_position: 1
description: "Meta-pravidlo — jak se v Elektro Kutílek tvoří dokumentace jakéhokoli procesu, systému nebo pravidla"
category: law
layer: bimg
audience: [firma]
version: "1.0"
author: Jan Kutílek
date: 2026-04-14
---

# 📐 Model tvorby dokumentace — Elektro Kutílek

:::info
**📜 LAW** · v1.0 · 👤 Jan Kutílek · 📅 2026-04-14

**Meta-pravidlo.** Stanovuje, jak se v Elektro Kutílek tvoří dokumentace jakéhokoli procesu, systému nebo pravidla. Řídí všechny ostatní dokumenty.
:::

Tato stránka je **rozcestník a principy modelu dokumentace**. Detailní metodiky pro jednotlivé vrstvy jsou v subpage.

---

## 🎯 Princip

Dokumentace není jeden dokument pro všechny. Je to **tři vrstvy pro tři různé čtenáře a tři různé situace**. Každá vrstva má jiný účel, jiný formát a jiné pravidlo pro aktualizaci.

Analogie: architektonický výkres → technická dokumentace → uživatelská příručka. Všechny tři dokumentují tentýž dům, ale každá odpovídá na jinou otázku.

---

## 📚 Tři vrstvy dokumentace — přehled

| # | Vrstva | Otázka | Adresát | Formát |
|---|--------|--------|---------|--------|
| 1 | **BIG IMAGE** | Proč a jak je to postavené? | Architekt, majitel, budoucí já | Souvislý text + diagramy, pages + subpages |
| 2 | **SOP** | Jak to mám udělat? | Vykonavatel úkonu | Check-list, max 1 obrazovka |
| 3 | **CHL** (Cheatlist) | Co mám rychle vědět? | Nováček, kdokoli pod stresem | 1 A4, tabulka/diagram |

---

## 🧩 Klíčové pravidlo: každé téma má tři vrstvy

Každé téma, které dokumentujeme (datová architektura, zpracování faktur, onboarding…), **má nebo časem získá všechny tři vrstvy**:

```
TÉMA „X"
├── 🧠 Big Image (pages + subpages)    ← proč, co, jak je to postavené
├── 📋 SOP (jeden nebo více)            ← jak konkrétně úkon provést
└── 🎴 CHL (jeden nebo více)            ← co si rychle připomenout
```

Vrstvy vznikají **postupně a shora dolů** — nejdřív Big Image (zatvrdne), pak SOP (destiluje se), pak CHL (vytahané eso).

---

## 🔄 Závislosti mezi vrstvami

```
    BIG IMAGE          SOP              CHL
      (proč)    ──▶    (jak)    ──▶   (shrnutí)
        │                │                 │
    zatvrdne         destiluje se     vytahané eso
    jako první        z Big Image     z Big Image + SOP
```

:::warning Směr destilace je jednosměrný, shora dolů
- Když se změní **Big Image** → revize **SOP** → přetisk **CHL**.
- Nikdy ne obráceně. CHL se nesmí stát zdrojem pravdy.
:::

---

## ⏱️ Pořadí tvorby

1. **Nejdřív Big Image — až „zatvrdne".** Bez toho nelze psát SOP, protože by se neustále přepisovaly.
2. **Pak SOP — destilací z Big Image.** Jedna činnost = jeden SOP.
3. **Pak CHL — až se ukáže, co lidi opravdu potřebují rychle.** Nepsat předem, je to plýtvání.

:::danger Protipattern
Začít psát SOP („Jak uložit fakturu") dřív, než je jasná disková architektura a taxonomie. Vznikne SOP, který za měsíc vyhodíš.
:::

---

## 🧭 Rozhodovací vodítko

Když si nejsi jistý, do které vrstvy co patří:

| Otázka čtenáře | Vrstva |
|----------------|--------|
| „Proč jsme to udělali takhle?" | 1 — Big Image |
| „Co to znamená / jak to funguje obecně?" | 1 — Big Image |
| „Jak konkrétně to mám teď udělat?" | 2 — SOP |
| „Kterou ikonku mám kliknout?" | 2 — SOP |
| „Kam to mám uložit? Rychle." | 3 — CHL |
| „Jakou barvu má co?" (shrnutí) | 3 — CHL |

Rychlou variantu tohoto vodítka máš i v 🎴 [CHL: Kterou vrstvu použít](./chl-kterou-vrstvu-pouzit).

---

## 📖 Metodiky jednotlivých vrstev

- **[🧠 Metodika Big Image](./metodika-big-image)** — jak psát koncepční dokumenty (šablona, pages+subpages, pojmenování)
- **[📋 Metodika SOP](./metodika-sop)** — jak psát postupy (šablona, struktura kroků, délka, kde v Mozkotron)
- **[🎴 Metodika CHL](./metodika-chl)** — jak dělat cheatlisty (formát A4, tabulka vs. diagram, tisk, aktualizace)

---

## 💡 Filozofické poznámky

**Proč ne jeden dokument pro všechno?** Protože tentýž text pro majitele (Big Image) je přebytečný pro zaměstnance, který má jen zpracovat fakturu. A stručný SOP je zas nepochopitelný pro někoho, kdo neví, proč to vůbec děláme.

**Proč ne psát všechno najednou?** Protože spodní vrstvy jsou závislé na horních. Když se Big Image přepíše, přepíše se vše pod ním. Pokud jsou SOP připravené předem, je to zmařená práce.

**Proč vůbec pravidlo pro dokumentaci?** Bez pravidla vznikne hybrid — dokumenty, co jsou částečně „proč", částečně „jak" a částečně „kartička". Nikdo je nechce číst, protože neodpovídají na konkrétní otázku.

---

## 🚧 Fázování pro projekt Datový OS

| Fáze | Vrstva | Co |
|------|--------|----|
| 0–2 | **Jen Big Image** | Zákon, taxonomie, architektura — zatvrdnout |
| 3–5 | Big Image + **začínají SOP** | Mozkotron struktura, konvence, vznikají první SOP |
| 6–7 | Všechny tři | Onboarding, migrace — vzniká CHL |
| 8+ | Údržba | Revize shora dolů, nikdy zdola nahoru |

---

*Dokument je meta-pravidlo — řídí tvorbu všech ostatních dokumentů v projektu Datový OS.*
*Navazuje na: [📜 Datový zákon](../law-obecne/datovy-zakon)*
*Vlastník: Jan Kutílek · 2026-04-14*
