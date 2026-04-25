---
title: "📋 Metodika SOP"
sidebar_label: "Metodika SOP"
sidebar_position: 3
description: "Jak psát postupy — šablona, struktura kroků, délka, pojmenování"
category: law
layer: bimg
audience: [firma]
version: "1.0"
author: Jan Kutílek
date: 2026-04-14
---

# 📋 Metodika SOP — jak psát postupy

SOP = **Standard Operating Procedure**. Krátký, procedurální návod „jak to udělat", určený vykonavateli úkonu.

---

## 🎯 Účel

SOP odpovídá na otázku: *„Jak to konkrétně mám teď udělat?"*

Vykonavatel **nemusí chápat celek** — potřebuje jen zvládnout úkon. Proto SOP nevysvětluje „proč" (to je úkol Big Image). Jen popisuje kroky.

---

## 👤 Adresát

- Zaměstnanec, který má úkol **provést**, ne o něm rozhodovat.
- Může to být nováček i zkušený — SOP nemá být zjevně „pro hloupé", ale ani nemá předpokládat, že si člověk pamatuje detaily.
- V krizové situaci (pod stresem, po dovolené, v zástupu za kolegu) musí být SOP použitelný **bez ptaní**.

---

## 📏 Pravidla

### 1. Max 1 obrazovka

SOP, co se musí scrollovat, přestává být SOP. Limit: **cca 20–30 řádků kroků + hlavička**.

Když je delší: rozsekat na **více SOP** (jedno SOP = jeden ucelený úkon), nebo přesunout vysvětlení *proč* do odkazovaného Big Image dokumentu.

### 2. Jeden SOP = jeden úkon

Úkon má jasný začátek, konec a výsledek. **Špatně:** „Správa faktur". **Správně:** „Zpracuj přijatou režijní fakturu".

### 3. Titulek začíná slovesem v rozkazovacím způsobu

- ✅ „Založ…", „Zpracuj…", „Archivuj…", „Odešli…"
- ❌ „Založení nového projektu", „Jak pracovat s…"

### 4. Kroky jsou číslované a atomické

- Každý krok = jeden akční bod.
- Žádná slova „může", „obvykle", „mělo by".
- Pokud je větvení („když X, jdi na krok 5; jinak pokračuj"), explicitně ho napsat.

### 5. Odkaz na Big Image

Každý SOP na konci obsahuje řádek **„Proč se to takhle dělá → [odkaz na Big Image dokument]"**. Kdo chce chápat, proklikne se. Kdo chce jen udělat, neřeší.

### 6. Kdo, kdy, co za výsledek

Hlavička SOP musí obsahovat:
- **Kdo** úkon vykonává (role, ne jméno)
- **Kdy** se to dělá (spouštěč — „při přijetí faktury", „každý pátek")
- **Výsledek** (jak poznám, že je hotovo)

---

## 🏷️ Pojmenování a umístění

### Konvence názvu

`SOP_AORx_nazev-ukonu` — například:
- `SOP_AOR2_Zpracuj-prijatou-rezijni-fakturu`
- `SOP_AOR4_Objednej-zbozi-do-skladu`
- `SOP_AOR6_Rekonfiguruj-PXE-image`

Prefix `AORx` = která AOR skupina úkon provádí (stejná logika jako u XPR disků).

**Výjimka:** cross-group / meta SOP (např. SOP k tématu dokumentace) prefix `AORx` nemají.

### Umístění v Mozkotron

- **Sekce „SOP knihovna"** (odpovídá kategorii SOP z taxonomie).
- **Členěno podle AOR skupin** — stejná struktura jako fyzická organizace firmy.
- Každý SOP = samostatná stránka. Ne sekce v dlouhém dokumentu.

---

## 📐 Šablona SOP

```markdown
---
title: "📋 SOP: [Sloveso] [co]"
sidebar_label: "SOP: [Krátký label]"
type: sop
---

# 📋 SOP: [Sloveso] [co]

| Parametr | Hodnota |
|----------|---------|
| Kdo | [role, ne jméno] |
| Kdy | [spouštěč / frekvence] |
| Výsledek | [jak poznám, že je hotovo] |
| AOR skupina | [která] |
| Verze | vX.Y · [datum] |
| Vlastník | [kdo SOP udržuje] |

## Kroky

1. [První akce — sloveso v rozkazu]
2. [Druhá akce]
3. [Třetí akce]
   - Pokud [podmínka], pokračuj krokem X
   - Jinak pokračuj dál
4. [Další akce]
5. [Finální kontrola — jak ověřím, že je hotovo]

## Co dělat, když něco nejde

- **Problém A** → řešení nebo kontakt
- **Problém B** → řešení nebo kontakt

## Odkazy

- Proč to takhle děláme → [odkaz na Big Image]
- Související SOP → [odkazy]
```

---

## 🔄 Životní cyklus SOP

| Stav | Co to znamená |
|------|---------------|
| **Draft** | Píše se, neplatí |
| **Platné** | V produkci, vykonává se podle něj |
| **Revize** | Mění se Big Image → SOP se reviduje |
| **Zrušeno** | Proces zanikl, SOP se nepoužívá (nemaže — historie) |

:::note Pravidlo revize
Po každé změně Big Image projít všechny odvozené SOP. Buď jsou stále validní, nebo se upraví.
:::

---

## ✅ Checklist než SOP „publikuješ"

- [ ] Titulek začíná slovesem
- [ ] Vejde se na jednu obrazovku
- [ ] Je definováno Kdo / Kdy / Výsledek
- [ ] Kroky jsou očíslované a atomické
- [ ] Odkaz na Big Image je na konci
- [ ] Je v Mozkotron pod správnou AOR sekcí
- [ ] Někdo jiný než autor to zkusil podle toho provést a uspěl

:::warning
**Poslední bod je klíčový.** SOP, který fungoval jen pro autora, není SOP.
:::

---

*Nadřazená stránka: [📐 Model dokumentace](./model-dokumentace)*
*Sourozenci: [🧠 Metodika Big Image](./metodika-big-image) · [🎴 Metodika CHL](./metodika-chl)*
