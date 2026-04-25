---
title: "📋 SOP: Založ nový Big Image"
sidebar_label: "SOP: Založ Big Image"
sidebar_position: 6
description: "Kroky pro vytvoření nového Big Image dokumentu"
category: proc
layer: sop
audience: [firma]
source_bimg: model-dokumentace
version: "1.0"
author: Jan Kutílek
date: 2026-04-14
---

# 📋 SOP: Založ nový Big Image dokument

| Parametr | Hodnota |
|----------|---------|
| Kdo | Architekt dokumentu (obvykle Jan nebo pověřený vlastník tématu) |
| Kdy | Když vzniká nové téma, které je potřeba konceptuálně popsat |
| Výsledek | Big Image dokument v Mozkotron, propojený s ostatními |
| AOR skupina | Cross-group (meta) |
| Verze | v1.0 · 2026-04-14 |
| Vlastník | Jan Kutílek |

## Kroky

1. **Rozhodni, do které sekce v Mozkotron téma patří.** Zkontroluj existující sidebar — patří do stávající sekce, nebo je potřeba nová?
2. **Rozhodni, jestli bude mít subpage.** Pokud se téma vejde na 1–2 obrazovky → jen hlavní stránka. Pokud má logicky oddělitelné části → hlavní stránka + subpage.
3. **Založ MD soubor(y)** ve správné složce v `docs/` podle Docusaurus konvence (slug = kebab-case).
4. **Použij šablonu Big Image** (viz [🧠 Metodika Big Image](./metodika-big-image)). Vyplň frontmatter: title, sidebar_label, sidebar_position, description, type, version, author, date.
5. **Napiš sekci Princip** (1 větou: proč dokument existuje, jaký je klíčový koncept).
6. **Doplň hlavní sekce** — nejdřív přehledové (tabulka, diagram), pak detaily. Pokud má subpage, hlavní stránka obsahuje **jen rozcestník + principy**.
7. **V každé subpage** uveď na začátku odkaz na nadřazenou stránku a na konci odkaz na sourozence.
8. **Zkontroluj, že dokument neobsahuje „jak kliknout"** — to by patřilo do SOP, ne do Big Image.
9. **Přidej sekci Otevřené body** — co se v tomto dokumentu neřeší a je odloženo na pozdější fáze.
10. **Projdi checklist** na konci Metodiky Big Image. Pokud všechno sedí, dokument je „Platný".

## Co dělat, když něco nejde

- **Nevím, jestli má být hlavní stránka nebo subpage** → začni hlavní stránkou. Když překročí 2 obrazovky, rozsekej.
- **Téma se překrývá s existujícím dokumentem** → zvaž, jestli to není subpage existujícího dokumentu.
- **Nemám jasno v principu** → ještě nepsat. Big Image vyžaduje, aby koncept „zatvrdl" v hlavě.

## Odkazy

- Proč se to takhle dělá → [🧠 Metodika Big Image](./metodika-big-image)
- Nadřazený koncept → [📐 Model dokumentace](./model-dokumentace)
- Související SOP → [SOP: Napiš SOP](./sop-napis-sop) · [SOP: Vyrob CHL](./sop-vyrob-chl)
