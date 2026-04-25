---
title: "🧠 Metodika Big Image"
sidebar_label: "Metodika Big Image"
sidebar_position: 2
description: "Jak psát koncepční dokumenty — šablona, pages+subpages, pojmenování"
category: law
layer: bimg
audience: [firma]
version: "1.0"
author: Jan Kutílek
date: 2026-04-14
---

# 🧠 Metodika Big Image — jak psát koncepční dokumenty

Big Image = **konceptuální dokumentace systému**. Vysvětluje *proč* a *co* — ne *jak*. Je to nejvyšší vrstva dokumentace, ze které se destiluje všechno ostatní (SOP, CHL).

---

## 🎯 Účel

Big Image odpovídá na otázku: *„Proč a jak je to postavené?"*

Čtenář Big Image **rozhoduje** o systému — nepoužívá ho mechanicky. Potřebuje pochopit principy, závislosti, důvody. Musí po přečtení umět říct „aha, takhle to tedy funguje a proto je to takhle."

---

## 👤 Adresát

- **Architekt systému** (Jan, budoucí nástupce).
- **Majitel / rozhodovatel** — potřebuje rozumět, aby mohl měnit.
- **Nový klíčový člen týmu** (vedoucí sekce, IT správce) — první pár týdnů.
- **Budoucí já** po roce — když zapomenu, proč jsem to takhle postavil.

Big Image **není pro vykonavatele běžných úkonů**. Ten má jít do SOP.

---

## 📏 Pravidla

### 1. Popisuje „co a proč", nikdy „jak"

- ✅ „Taxonomie má 10 kategorií rozdělených do 4 skupin, protože…"
- ❌ „Klikni na tlačítko Nová kategorie a vyplň pole Název."

Jestli tě láká napsat konkrétní kroky, patří to do SOP. Big Image vysvětluje principy, které SOP zaštiťuje.

### 2. Členění na pages a subpages

Hlavní stránka je **rozcestník + principy**. Detaily jdou do subpage.

**Kdy rozsekat na subpage:**
- Když hlavní stránka přesáhne cca 2 obrazovky.
- Když má dokument logicky oddělitelné části (typy, kategorie, aspekty).
- Když chceš, aby se jednotlivé části daly odkazovat samostatně.

**Kdy subpage nepoužívat:**
- Krátké dokumenty (1 obrazovka) — nepotřebují.
- Když části nedávají smysl samostatně.

### 3. Subpage = samostatná stránka, ne kotva

V Mozkotron musí být subpage **vlastní stránka s vlastní URL**. Ne sekce v dlouhém dokumentu. Ne kotva. Proč: stránky se dají sdílet odkazem, přesouvat, přejmenovávat, obsahují metadata.

### 4. Aktualizace = událost

Big Image se mění zřídka, ale pečlivě. Po každé změně **projít všechny odvozené SOP a CHL** a zkontrolovat, jestli jsou stále validní.

---

## 📐 Šablona Big Image dokumentu

```markdown
---
title: "[Ikona] [Název]"
sidebar_label: "[Krátký label]"
sidebar_position: [číslo]
description: "[Stručný popis]"
type: [law / know]
version: "X.Y"
author: [Kdo]
date: [YYYY-MM-DD]
---

# [Ikona] [Název] — Elektro Kutílek

:::info
**📜 LAW / 🧠 KNOW** · vX.Y · 👤 Vlastník · 📅 Datum

Stručné shrnutí toho, co dokument řeší a s čím souvisí.
:::

[Pokud má subpage:]
Tato stránka je **rozcestník a principy**. Detaily jsou v subpage.

---

## 🎯 Princip
[Jednou větou: proč to existuje a jaký je klíčový koncept.]

## [Hlavní sekce — přehled]
[Tabulka, diagram nebo tézový přehled.]

## [Další sekce]
...

## 📖 Rozcestník (pokud má subpage)
- **[subpage 1](./link)** — popis
- **[subpage 2](./link)** — popis

## 📎 Otevřené body
...

---
*Navazuje na: [odkazy] · Vlastník: [kdo] · [datum]*
```

---

## ✅ Checklist než Big Image „publikuješ"

- [ ] Neobsahuje návody „jak kliknout" (to patří do SOP)
- [ ] Hlavní stránka se vejde do 2 obrazovek, nebo je rozsekaná na subpage
- [ ] Subpage jsou samostatné stránky, ne kotvy
- [ ] Každá subpage uvádí nadřazenou stránku
- [ ] Je evidován vlastník a datum
- [ ] Odkazy na související dokumenty jsou na konci
- [ ] Otevřené body jsou vyčleněny do samostatné sekce

---

## 📋 Související SOP a CHL

- **[CHL: Kterou vrstvu použít](./chl-kterou-vrstvu-pouzit)** — rychlá rozhodovací kartička

---

*Nadřazená stránka: [📐 Model dokumentace](./model-dokumentace)*
*Sourozenci: [📋 Metodika SOP](./metodika-sop) · [🎴 Metodika CHL](./metodika-chl)*
