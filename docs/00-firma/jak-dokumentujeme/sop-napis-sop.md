---
title: "📋 SOP: Napiš nový SOP"
sidebar_label: "SOP: Napiš SOP"
sidebar_position: 7
description: "Kroky pro napsání nového standardního operačního postupu"
category: proc
layer: sop
audience: [firma]
source_bimg: model-dokumentace
version: "1.0"
author: Jan Kutílek
date: 2026-04-14
---

# 📋 SOP: Napiš nový SOP

| Parametr | Hodnota |
|----------|---------|
| Kdo | Vlastník procesu (kdo ten úkon zná nejlíp) + schválení architektem |
| Kdy | Když je Big Image k danému tématu hotový a zatvrdlý |
| Výsledek | SOP stránka v Mozkotron, max 1 obrazovka, vyzkoušená druhým člověkem |
| AOR skupina | Cross-group (meta) |
| Verze | v1.0 · 2026-04-14 |
| Vlastník | Jan Kutílek |

## Kroky

1. **Ověř, že existuje Big Image** k danému tématu a že je „zatvrdlý" (stabilní, schválený). Pokud ne → STOP, nejdřív Big Image.
2. **Identifikuj jeden konkrétní úkon.** SOP = jedna činnost s jasným začátkem, koncem a výsledkem.
3. **Pojmenuj SOP:** `SOP_AORx_Sloveso-co` (např. `SOP_AOR2_Zpracuj-prijatou-fakturu`). Cross-group SOP nemá AOR prefix.
4. **Založ MD soubor** ve správné sekci `docs/` s Docusaurus frontmatter.
5. **Vyplň hlavičku:** Kdo / Kdy / Výsledek / AOR / Verze / Vlastník.
6. **Napiš kroky:** číslované, atomické, sloveso v rozkazu. Žádná „může", „obvykle".
7. **Přidej sekci „Co dělat, když něco nejde"** — nejčastější problémy a kontakty.
8. **Na konec přidej odkaz na Big Image** → „Proč se to takhle dělá".
9. **Dej to přečíst a vyzkoušet druhému člověku.** Pokud uspěje bez doptávání → SOP je hotový.
10. **Zkontroluj, že se vejde na 1 obrazovku.** Pokud ne → rozděl na dva SOP.

## Co dělat, když něco nejde

- **Úkon je příliš složitý na 1 obrazovku** → rozděl na podúkony, každý = vlastní SOP.
- **Nevím, kdo je adresát** → zeptej se vedoucího AOR skupiny.
- **Proces se ještě mění** → nepsat SOP, počkat na zatvrdnutí Big Image.

## Odkazy

- Proč se to takhle dělá → [📋 Metodika SOP](./metodika-sop)
- Nadřazený koncept → [📐 Model dokumentace](./model-dokumentace)
- Související SOP → [SOP: Založ Big Image](./sop-zaloz-bimg) · [SOP: Vyrob CHL](./sop-vyrob-chl)
