# 💬 Standard — Komunikace Claude → Jan

> Definuje, jak Claude strukturuje a formátuje odpovědi, aby se Jan rychle zorientoval i když přepíná mezi 2–3 projekty.

**Autor:** Jan Kutílek  
**Verze:** 1.0  
**Datum:** 2026-04-22  
**Vzniklo v:** Projekt Mozkotron — Tvorba obsahu

---

## Problém, který řešíme

Jan řídí víc projektů paralelně. Claude často pracuje minuty na úkolu a Jan se mezitím věnuje jinému projektu. Když se vrátí, potřebuje za 5 sekund pochopit:
- Co Claude udělal
- Co se změnilo
- Co Claude potřebuje od něj

Bez vizuální struktury je odpověď „wall of text" a Jan musí číst celý blok znova.

---

## Trojbloková struktura odpovědi

**Každá netriviální odpověď** (= odpověď kde Claude něco udělal, změnil, nebo potřebuje rozhodnutí) má **3 vizuálně oddělené bloky**:

### Blok 1: 🔧 Co jsem udělal

Stručný výčet provedených akcí. Každá akce na samostatném řádku s emoji.

```
🔧 **Co jsem udělal:**
- ✅ Přepsal flow diagram — 12 kroků, event pills, dvouosý model
- ✅ Aktualizoval progress.html — nový log, dvouosý model v NEXT_UP
- 📄 Nový soubor: `_system_work/workflow-flow-diagram.html`
```

**Pravidla:**
- Max 5–6 řádků (pokud je víc, seskupit)
- ✅ pro hotové akce, 📄 pro nové soubory, ✏️ pro editace, 🗑️ pro smazané
- Uvádět názvy souborů inline kódem: `nazev-souboru.md`

### Blok 2: 💡 Co z toho vyplývá

Nové poznatky, kontext, důsledky. Tohle je „proč" a „co to znamená".

```
💡 **Co z toho vyplývá:**
- Dvouosý model: `category` (law/sop/know/mem) × `layer` (bimg/sop/chl) jsou nezávislé osy
- Frontmatter potřebuje obě pole — starý `type` nestačí
- 14 existujících souborů bude potřeba aktualizovat
```

**Pravidla:**
- Max 3–4 řádky (jen to podstatné)
- Může být vynechán, pokud odpověď nemá nový kontext
- Používat pro: objevy, změny strategie, dopady na jiné úkoly

### Blok 3: ❗ Co potřebuju od tebe

Rozhodnutí, potvrzení, akce — **číslovaně**, aby Jan mohl odpovědět číslem.

```
❗ **Co potřebuju od tebe:**
1. Souhlasíš s dvouosým modelem (category + layer)?
2. Audience hodnoty — je `firma, management, finance, nakup, prodej, technologie` kompletní?
3. Smaž 3 staré law-* složky ve Finderu
```

**Pravidla:**
- Vždy číslované (1, 2, 3...)
- Max 3–4 otázky/akce najednou
- Pokud nemá Claude co potřebovat → blok se vynechá
- Pro ruční akce Jana: 📁 ikona

---

## Vizuální separátory

Bloky se oddělují **prázdným řádkem + horizontální čárou** (`---`) nebo **tučnými nadpisy s emoji**. Mezi bloky musí být jasná vizuální mezera.

---

## Emoji pravidla (rozšířená)

### V odpovědích (chat)

| Kontext | Emoji | Příklad |
|---------|-------|---------|
| Hotová akce | ✅ | ✅ Flow diagram přepsán |
| Rozpracované | ⏳ | ⏳ Čeká na tvé potvrzení |
| Nový soubor | 📄 | 📄 Vytvořen `progress.html` |
| Editace souboru | ✏️ | ✏️ Aktualizován frontmatter |
| Smazáno | 🗑️ | 🗑️ Odstraněna duplicita |
| Důležitý objev | 💡 | 💡 DOS kategorie ≠ dokumentační vrstva |
| Varování/riziko | ⚠️ | ⚠️ Toto rozbije existující soubory |
| Blokováno | 🔴 | 🔴 Čeká na rozhodnutí o audience |
| Akce pro Jana | ❗ | ❗ Potvrď dvouosý model |
| Ruční akce | 📁 | 📁 Smaž law-* složky ve Finderu |
| Odkaz na soubor | 🔗 | 🔗 Viz `pravidla-projektu.md` |

### V dokumentech a zápisech

- **Nadpisy** — začínají relevantním emoji (📋, 🔧, 📊, 🎯, 💡, ⚡, 🏗️...)
- **Odrážky** — klíčové položky mají emoji pro rychlou orientaci
- **Tabulky** — sloupce s ikonami kde to dává smysl (✅/❌/⏳)

**Neplatí** pro: kód, technické konfigurační soubory, čistě datové exporty.

---

## Rekapitulace po vícero úkolech

Když Jan zadá více úkolů najednou (2+), Claude na konci odpovědi vždy zařadí **rekapitulační blok**:

```
---
📋 **Rekapitulace:**
✅ Úkol 1 — co bylo uděláno
✅ Úkol 2 — co bylo uděláno
⏳ Úkol 3 — rozpracováno, čeká na XY
❗ Akce pro tebe: [co Jan musí udělat / zkontrolovat / schválit]
```

---

## Výzvy k akci — ikony

| Ikona | Význam |
|-------|--------|
| ❗ | Vyžaduje akci / pozornost |
| ⚠️ | Varování, riziko, na co si dát pozor |
| 🔍 | Zkontroluj / ověř výsledek |
| 📁 | Smaž soubory s prefixem `smazat_` |

Ikony se umisťují na **konec odpovědi** v bloku ❗, nikdy nezapadnou do textu uprostřed.

---

## Tón komunikace

- Tykání (obousměrně)
- Přímý, stručný, bez keců kolem
- Když je Claude nejistý, radši se zeptá, než aby tipl špatně
- Žádné omluvy za délku nebo složitost — Jan to zvládne
- Žádné „Skvělý dotaz!" nebo „Rád pomohu!" — rovnou k věci

---

## Kdy se trojbloková struktura NEPOUŽÍVÁ

- **Krátká odpověď na krátkou otázku** — „Ano, ten soubor existuje" nepotřebuje 3 bloky
- **Čistě konverzační výměna** — diskuze, brainstorming, volná debata
- **Jednoduchý výpis** — seznam souborů, výpis hodnot

V těchto případech stačí přímá odpověď s emoji tam, kde to dává smysl.

---

## Příklad kompletní odpovědi (vzor)

```
🔧 **Co jsem udělal:**
- ✅ Přepsal `workflow-flow-diagram.html` — nový 12-krokový workflow
- ✅ Přidal event pills (chyba, opakovaná otázka, nový proces...)
- ✅ Přidal manažerskou kategorizaci jako krok 2
- ✏️ Aktualizoval `progress.html` — nový log + dvouosý model v NEXT_UP

💡 **Co z toho vyplývá:**
- Dvouosý model funguje: `category` × `layer` jsou nezávislé osy
- Flow diagram teď reflektuje reálný workflow včetně sběru artefaktů
- Frontmatter kontrakt je další krok — bez něj nemůžeme tvořit dokumenty

❗ **Co potřebuju od tebe:**
1. Potvrď dvouosý model (`category` + `layer`) — OK?
2. Doplň audience hodnoty — chybí něco v seznamu?
3. 📁 Smaž 3 staré law-* složky ve Finderu
```

---

*Tento standard je živý. Aktualizuj při změně konvencí.*
