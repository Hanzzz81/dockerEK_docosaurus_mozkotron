# 📋 Šablona — CHL (Cheat List)

> Zkrácená verze nad obsáhlejším SOP. Tabulka, diagram nebo checklist na 1–2 strany. Vždy vychází z mateřského BIMG. Vytiskni, polep na zeď, používej denně.

---

## Frontmatter

```yaml
---
title: "⚡ Název cheat listu"
sidebar_label: "Krátký label"
sidebar_position: 3
description: "Jedna věta — rychlá reference k čemu"
category: proc                   # law | proc | know | mem
layer: chl                      # vždy chl
audience: [prodej]               # array z AOR
source_bimg: reklamacni-rad-bimg # slug mateřského BIMG — POVINNÉ
version: "1.0"
author: Jan Kutílek
date: 2026-04-22
---
```

**Poznámky:**
- `source_bimg` je **povinné**
- CHL je odvozenina — nikdy neexistuje bez BIMG

---

## Struktura dokumentu

CHL má **3 povolené formáty** — vyber ten, který nejlíp sedí:

### Formát A: Tabulka

```markdown
# Název

| Situace | Co udělat | Pozor na |
|---------|-----------|----------|
| Zákazník přijde s vadou | Přijmi, zaeviduj | Nikdy neodmítej |
| Záruka vypršela | Nabídni placenou opravu | Ověř v Money S4 |
| Zboží poškozené dopravou | Foť, reklamuj u dopravce | Do 48h |
```

### Formát B: Checklist

```markdown
# Název

- [ ] Krok 1 — co udělat
- [ ] Krok 2 — co udělat
- [ ] Krok 3 — co udělat
- [ ] Krok 4 — co udělat

:::danger
Pokud jsi neodškrtl všechno, neodesílej!
:::
```

### Formát C: Diagram / vizuál

```markdown
# Název

:::info
Rozhodovací strom — kdy co platí
:::

\`\`\`mermaid
flowchart TD
    A[Zákazník přišel s reklamací] --> B{Záruka platí?}
    B -->|Ano| C[Přijmi reklamaci]
    B -->|Ne| D[Nabídni placenou opravu]
    C --> E[Zaeviduj v Money S4]
    D --> E
\`\`\`
```

---

## Pravidla formátu

- **Délka:** max **1×A4** (tisknutelné)
- **Žádný souvislý text** — jen tabulky, checklisty nebo diagramy
- **Subpages:** ZAKÁZANÉ
- **Screenshoty:** max 1–2 (malé, orientační)
- **Tisknutelný:** CHL musí vypadat dobře i na papíře
- **Princip:** zaměstnanec to nalepí vedle monitoru a kouká na to 10× denně

---

## Příklad — CHL reklamační lhůty

```markdown
---
title: "⚡ Reklamační lhůty — quick ref"
sidebar_label: "Lhůty reklamace"
sidebar_position: 3
description: "Rychlý přehled reklamačních lhůt dle typu zboží"
category: law
layer: chl
audience: [prodej, sluzby]
source_bimg: reklamacni-rad-bimg
version: "1.0"
author: Jan Kutílek
date: 2026-04-22
---

# ⚡ Reklamační lhůty

| Typ zboží | Záruční doba | Lhůta na vyřízení | Kdo rozhoduje |
|-----------|-------------|-------------------|---------------|
| Spotřební elektronika | 24 měsíců | 30 dnů | Vedoucí prodejny |
| Náhradní díly | 12 měsíců | 30 dnů | Vedoucí prodejny |
| Instalační práce | 36 měsíců | 30 dnů | Jan/Michal |
| Použité zboží | 12 měsíců | 30 dnů | Vedoucí prodejny |

:::warning
Lhůta 30 dnů je zákonná. Překročení = automatická výměna/vrácení peněz.
:::

:::tip
Nejsi si jistý? → Přijmi a zaeviduj. Rozhodnutí udělá vedoucí.
:::
```

---

*Šablona v2.0 — aktualizováno 2026-04-23 (R017: sop→proc v kategoriích)*
