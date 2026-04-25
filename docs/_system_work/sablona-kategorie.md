# 📐 Šablony per kategorie — povinné sekce a patterny

> Tento soubor doplňuje šablony per vrstva (sablona-bimg/sop/chl.md).
> Vrstva říká JAK hluboký dokument. Kategorie říká JAKÉ SEKCE má mít.
> Při tvorbě dokumentu se kombinují obě osy: vrstva + kategorie.

---

## 📜 LAW — Co platí

**Tón:** Striktní, jasný, jednoznačný. Žádné "obvykle", "možná", "asi". Pravidlo je pravidlo.

### Povinné sekce (BIMG):

1. **Co platí** — jasná formulace pravidla. Stručně, bez omáčky
2. **Kdo odpovídá** — role, která za dodržování nese zodpovědnost
3. **Co za porušení** — důsledky porušení (zákonný postih, firemní postih)
4. **Od kdy platí** — datum účinnosti, číslo verze
5. **Výjimky** — kdy pravidlo neplatí, speciální případy
6. **Kde je to evidované** — kde visí, kde je zdroj, odkaz na soubor/grafiku

### Příklad: Otevírací doba
- Co platí: Po–Pá 8:00–17:00, So 8:00–12:00
- Kdo odpovídá: vedoucí provozu
- Co za porušení: zákazník před zavřenou prodejnou = ztráta tržby + reputace
- Od kdy: verze 1.0, platí od 2025-01
- Výjimky: Vánoce, státní svátky (viz příloha s kalendářem)
- Kde evidované: cedule na dveřích (odkaz na grafiku), web, Facebook, Google, Seznam

---

## 🔧 PROC — Jak to udělat

**Tón:** Instruktážní, krok za krokem. Jasné sloveso na začátku každého kroku. Čtenář to čte při práci.

### Pattern jednoho kroku (vertikální layout):

1. **Číslo + název kroku** — sloveso v rozkazovacím způsobu
2. **Text** — co udělat, kde, v jakém systému
3. **Screenshot** (volitelně) — obrázek obrazovky, fotka pracoviště
4. **Upozornění** (volitelně) — na co si dát pozor, častá chyba
5. **Výsledek kroku** — co máš mít po tomhle kroku, čím krok končí

### Layout:
- Vertikální — roluje se dolů (funguje i na telefonu)
- Každý krok = samostatný vizuální blok s oddělovačem
- Screenshot vždy pod textem, nikdy vedle (horizontální layout nefunguje na mobilu)

### Povinné sekce (SOP):

Hlavička:
- **Kdo** — role, která postup provádí
- **Kdy** — za jakých okolností se postup spouští
- **Kde** — v jakém systému / na jakém místě

Tělo:
- Číslované kroky v patternu výše

Patička:
- **Časté chyby** — co se stává špatně a jak to udělat správně
- **Souvisí** — odkaz na mateřský BIMG a případný CHL

### Příklad: Změna otevírací doby na Facebooku
- Krok 1: Otevři Facebook Business Manager → Nastavení → Informace o firmě
- Screenshot: kde najít menu
- Krok 2: Klikni na "Otevírací doba" → Upravit
- Screenshot: formulář s hodinami
- Upozornění: Facebook někdy resetuje změny — po uložení ověř, že se projevily
- Krok 3: Ulož a zkontroluj náhled stránky
- Výsledek: Na Facebooku svítí aktuální otevírací doba

---

## 💡 KNOW — Proč to tak je

**Tón:** Vysvětlující, kontextový. Čtenář potřebuje pochopit, ne jen udělat. Může obsahovat data, srovnání, historii.

### Povinné sekce (BIMG):

1. **Proč to tak je** — kontext, motivace, co vedlo k rozhodnutí. Proč to děláme takhle a ne jinak
2. **Jak to funguje** — vysvětlení principu, mechanismu, technologie. Srozumitelně pro cílovou roli
3. **Klíčové parametry** — čísla, srovnání, tabulky, specifikace. Data pro rozhodování
4. **Souvislosti a vazby** — na co to má vliv, co na to má vliv. Propojení s dalšími tématy
5. **Zkušenosti a poučení** — co jsme zkusili, co fungovalo, co ne. Historická data, precedenty
6. **Zdroje a reference** — odkazy na externí zdroje, legislativu, odborné články, interní docs

### Příklad: Proč máme firemní oblečení
- Proč: zákazník pozná zaměstnance na první pohled, profesionalita, značka
- Jak funguje: per role jiný úbor (prodejce, technik, back office), sezónní varianty
- Parametry: 3× košile, 2× kalhoty, 1× bunda per člověk, budget 15 000 Kč/osobu
- Souvislosti: návaznost na onboarding (výdej), offboarding (vrácení), branding
- Zkušenosti: zákazníci reagují pozitivně, snížil se počet dotazů "pracujete tady?"
- Zdroje: odkaz na vektorové podklady, dodavatel TextilPro

---

## 📝 MEM — Co se změnilo (žurnál)

**Tón:** Záznamový, věcný. Kdo, co, kdy, proč. Žádná interpretace — fakta.

**MEM není samostatný dokument.** Je to sekce uvnitř tematického bloku — žurnál "co se změnilo a proč". Samotná změna je vždy zapsaná v příslušném LAW/PROC/KNOW dokumentu (R019).

### Pattern jednoho záznamu:

1. **Název změny** — co se stalo (stručně)
2. **Datum** — měsíc/rok
3. **Proč** — důvod změny
4. **Kdo rozhodl** — jméno nebo role
5. **Dopad** — co se změnilo v LAW/PROC/KNOW dokumentu
6. **Tag** — typ změny (nové pravidlo / změna pravidla / zrušení) + číslo verze

### Layout:
- Nejnovější záznamy nahoře
- Každý záznam = samostatný blok s datem, textem a tagem
- Žurnál per tematický blok (ne per dokument)

### Příklad: Žurnál firemního oblečení
```
## 📝 Co se změnilo

### Duben 2026 — Přidány softshellky
Vesty nahrazeny softshellkami. Důvod: lepší odolnost, modernější vzhled.
Dodavatel: TextilPro s.r.o. Dopad: aktualizován LAW BIMG verze 1.1.
[změna pravidla] [v1.1]

### Září 2025 — Zavedení firemního oblečení  
První nákup: 3× košile, 2× kalhoty, 1× bunda per člověk.
Dodavatel: TextilPro. Budget: 45 000 Kč. Rozhodl: Jan Kutílek.
[nové pravidlo] [v1.0]
```

---

## Kombinace: kategorie × vrstva

| | BIMG | SOP | CHL |
|---|---|---|---|
| **LAW** | 6 sekcí výše | Postup dodržování pravidla (PROC pattern) | Quick ref pravidel (tabulka lhůt, limitů) |
| **PROC** | Přehled procesu high-level | Kroky per role (PROC pattern) | Zkrácená verze SOP |
| **KNOW** | 6 sekcí výše | Postup aplikace znalosti (PROC pattern) | Přehledová tabulka parametrů |
| **MEM** | Žurnál (pattern výše) | — | — |

MEM nemá SOP ani CHL — je to vždy jen žurnál.

---

*Šablona v1.0 — 2026-04-23*
