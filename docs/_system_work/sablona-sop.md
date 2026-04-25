# 📋 Šablona — SOP (Standard Operating Procedure)

> Postup per role. Text + obrázky/screenshoty + volitelně diagram. Délka se řídí tématem — bez limitu (R018). Vždy vychází z mateřského BIMG.

---

## Frontmatter

```yaml
---
title: "🔧 Název postupu"
sidebar_label: "Krátký label"
sidebar_position: 2
description: "Jedna věta — co postup řeší a pro koho"
category: proc                   # law | proc | know | mem
layer: sop                      # vždy sop
audience: [prodej]               # array z AOR
source_bimg: reklamacni-rad-bimg # slug mateřského BIMG — POVINNÉ
version: "1.0"
author: Jan Kutílek
date: 2026-04-22
---
```

**Poznámky:**
- `source_bimg` je **povinné** — každý SOP má rodiče
- `category` bývá nejčastěji `proc`, ale může být i `law` (postup dodržování pravidla) nebo `know` (postup aplikace znalosti)

---

## Struktura dokumentu

```markdown
# Název postupu

> **Kdo:** role, která postup provádí
> **Kdy:** za jakých okolností se postup spouští
> **Kde:** v jakém systému / na jakém místě

## ✅ Kroky

1. **Název kroku** — stručný popis, co udělat
   - Detail nebo upřesnění pokud třeba
   - Screenshot: `![krok 1](./img/krok-1.png)`

2. **Název kroku** — stručný popis
   - :::tip
     Tip pro efektivnější provedení
     :::

3. **Název kroku** — stručný popis

4. **Název kroku** — stručný popis
   - :::warning
     Na co si dát pozor
     :::

## ⚠️ Časté chyby

- ❌ Popis chyby → ✅ Jak to udělat správně
- ❌ Další chyba → ✅ Správný postup

## 🔗 Souvisí

- [Mateřský BIMG](./reklamacni-rad-bimg) — kompletní kontext
- [Cheat list](./reklamace-chl) — rychlá reference
```

---

## Pravidla formátu

- **Délka:** bez limitu — řídí se tématem (R018). Faktura vydaná = 6 stránek, založení do rozvozu = půl stránky
- **Kroky:** vždy **číslované** (1, 2, 3...), počet se řídí tématem
- **Screenshoty:** povolené, doporučené u systémových postupů
- **Diagram:** volitelně vývojový diagram jako alternativní vizualizace (nikdy jako jediná forma)
- **Subpages:** ZAKÁZANÉ — SOP musí být na jedné stránce
- **Princip:** 1 SOP = postup per role. Pro jinou roli = jiný SOP

---

## Příklad — SOP pro vyřízení reklamace

```markdown
---
title: "🔧 Vyřízení reklamace — příjem na prodejně"
sidebar_label: "Příjem reklamace"
sidebar_position: 2
description: "Krok za krokem: jak přijmout reklamaci od zákazníka na prodejně"
category: proc
layer: sop
audience: [prodej]
source_bimg: reklamacni-rad-bimg
version: "1.0"
author: Jan Kutílek
date: 2026-04-22
---

# 🔧 Vyřízení reklamace — příjem na prodejně

> **Kdo:** prodejce
> **Kdy:** zákazník přijde s vadným zbožím
> **Kde:** prodejna + Money S4

## ✅ Kroky

1. **Převezmi zboží** — zkontroluj vizuálně, zeptej se na popis závady
2. **Ověř záruku** — v Money S4 najdi původní prodej, zkontroluj datum
3. **Vyplň reklamační protokol** — Money S4 → Reklamace → Nová
   - Povinná pole: zákazník, produkt, popis závady, datum přijetí
4. **Dej zákazníkovi kopii** — vytiskni potvrzení o přijetí reklamace
5. **Ulož zboží** — označ štítkem s číslem reklamace, ulož do regálu „Reklamace"

## ⚠️ Časté chyby

- ❌ Odmítnout přijetí bez ověření → ✅ Vždy přijmi a zaeviduj, i když máš pochybnosti
- ❌ Zapomenout dát kopii zákazníkovi → ✅ Vždy tiskni potvrzení
```

---

*Šablona v2.0 — aktualizováno 2026-04-23 (R017: sop→proc, R018: bez limitu délky)*
