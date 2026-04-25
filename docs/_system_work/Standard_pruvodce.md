# 🗺️ Standard — Průvodce (interaktivní materiál pro komplexní témata)

> Když je téma příliš komplexní na prostý dokument, vytvoříme Průvodce — interaktivní HTML s přehledem, rozhodovacím stromem, maticí a kvízem.

**Autor:** Jan Kutílek  
**Verze:** 1.0  
**Datum:** 2026-04-22  
**Vzniklo v:** Projekt Mozkotron — Tvorba obsahu  
**Vzorový příklad:** `_system_work/trenink-kategorie.html`

---

## Kdy vytvořit Průvodce

- Téma má **víc než 2 varianty/kategorie**, které se dají zaměnit
- Rozhodování je **subjektivní** — závisí na úsudku člověka, ne na jednoznačném pravidlu
- Materiál bude sloužit k **zaučení dalších lidí** (editorů, manažerů, zaměstnanců)
- Prosté „přečti si dokument" nestačí — člověk potřebuje **procvičit** rozlišování

Průvodce NENÍ náhrada za LAW/SOP/KNOW dokumenty — je to **doprovodný materiál**, který pomáhá lidem správně pracovat s existujícím systémem.

---

## Struktura Průvodce (4 záložky)

### 📋 Záložka 1: Přehled (TL;DR)

**Účel:** Rychlá orientace — za 30 sekund pochopíš, o čem to je.

**Obsahuje:**
- Karty s přehledem variant/kategorií (emoji, název, tagline, definice, příklady)
- Mnemotechnická pomůcka (vizuální zkratka pro zapamatování)
- Srovnávací tabulka klíčových rozlišovacích otázek (3–4 otázky × N variant)

**Princip:** Kdo nemá čas, přečte jen tuhle záložku a má 80 % pochopení.

### 🌳 Záložka 2: Rozhodovací strom

**Účel:** Interaktivní průchod — klikáš na odpovědi, strom tě dovede ke správnému výsledku.

**Obsahuje:**
- 3–4 klíčové otázky (ano/ne nebo výběr z možností)
- Výsledek s vysvětlením a příklady
- Sekce „Časté pasti" — hraniční případy, které mátou (s vysvětlením, proč je odpověď taková)

**Princip:** Pokud si nejsi jistý, projdi strom. Pasti zachytí právě ty záludné situace.

### 📊 Záložka 3: Matice + hranice

**Účel:** Systematický přehled pro ty, kdo chtějí porozumět do hloubky.

**Obsahuje:**
- Srovnávací matice vlastností (tabulka: vlastnost × varianta)
- Reálné příklady z kontextu firmy (seskupené po tématech — jedno téma ve všech variantách)
- Klíčový insight (= ta jedna věta, která změní způsob uvažování)

**Princip:** Jedna tabulka nahradí 3 stránky textu.

### 🎯 Záložka 4: Kvíz

**Účel:** Ověření pochopení — procvičení na reálných scénářích.

**Obsahuje:**
- 8–12 scénářů z reálného prostředí firmy
- Klikací odpovědi (N variant)
- Okamžitá zpětná vazba: správná odpověď + vysvětlení PROČ
- Skóre na konci (procenta)

**Princip:** Kvíz odhalí, jestli člověk opravdu rozumí, nebo jen tuší.

---

## Vizuální standard

- **Dark theme** — shodný s ostatními HTML materiály (pozadí `#0f1117`, karty `#111827`)
- **Navigace nahoře** — záložky s emoji, aktivní zvýrazněná amber barvou
- **Karty kategorií** — barevný levý border dle kategorie
- **Self-contained HTML** — žádné externí závislosti, vše v jednom souboru
- **Responzivní** — funguje na mobilu i na druhém monitoru

---

## Kam ukládat

```
{PROJEKT}/_system_work/pruvodce-{tema}.html     ← projektové Průvodce
{PROJEKT}/4_pruvodci/pruvodce-{tema}.html       ← trvalé edukační materiály
docs/_system_work/pruvodce-{tema}.html           ← systémové Průvodce v Mozkotronu
```

Naming: `pruvodce-{tema}.html` (kebab-case, bez diakritiky v názvu souboru).

---

## Kdy Claude nabídne vytvořit Průvodce

Na začátku komplexního tématu se Claude zeptá:

> „Tohle téma má víc variant, které se dají zaměnit. Vytvořit k tomu Průvodce (interaktivní HTML s přehledem, stromem a kvízem)?"

---

*Tento standard je živý. Aktualizuj při změně konvencí.*
