---
title: "💡 Saldokonto — přehled účtů a párování"
sidebar_label: "Saldokonto"
sidebar_position: 1
description: "Proč máme saldokonto, jak funguje párování dokladů v Money S4, kdo odpovídá za kontroly a kde hledat chyby"
category: know
layer: bimg
audience: [finance]
version: "2.0"
author: Jan Kutílek
date: 2026-04-23
---

# 💡 Saldokonto — přehled účtů a párování

## TL;DR

Saldokonto = **kontrola, že si doklady v Money sedí**. 13 účtů v 5 skupinách. 7 kontroluješ denně, 4 týdně, 1 měsíčně. Když něco visí → špatný VS, chybějící doklad, nebo nesedí partner. Podrobnosti per skupinu v podstránkách níže.

| Skupina | Podstránka |
|---------|------------|
| 131 Sklady | [DLP vs FP, skladové převody](./saldokonto-131-sklady) |
| 261 Převody | [Tržby do banky, mezi pokladnami, mezi bankami](./saldokonto-261-prevody) |
| 314 Zálohy | [Zálohové faktury přijaté](./saldokonto-314-zalohy) |
| 315 Platební karty | [PHDK vs bankovní výpisy](./saldokonto-315-pk) |
| 395 Kontrolní | [Uzávěrky, nenapárované úhrady, přeplatky](./saldokonto-395-kontrolni) |

---

## 1. Proč to tak je

Firma denně generuje desítky dokladů — pokladní, bankovní výpisy, faktury, dodací listy. Každý pohyb peněz nebo zboží se v Money projeví na dvou místech (dva doklady, dvě strany). Pokud si ty dvě strany neodpovídají, znamená to chybu: neuhrazená faktura, chybějící doklad, špatné zaúčtování.

Bez saldokonta bychom chyby objevili až při uzávěrce DPH nebo roční závěrce — tedy pozdě. Saldokonto je **denní zdravotní kontrola účetnictví**. Zachytí problémy v řádu hodin, ne měsíců.

## 2. Jak to funguje

Každý saldokontní účet má **dvě strany dokladů**, které se mají „potkat":

:::tip Tři pravidla párování
1. Obě strany musí mít **stejný variabilní symbol (VS)**
2. Obě strany musí mít **stejného partnera (IČ)**
3. Obě strany musí mít **stejnou částku**

Když se setkají, položka zmizí (je spárovaná). Když zůstane viset, je to signál k akci — najít chybu a opravit.
:::

Účty jsou seskupené do pěti skupin podle toho, co párují:

| Skupina | Co hlídá | Příklad |
|---------|----------|---------|
| **131** | Sklad ↔ fakturace | Přišlo zboží na DLP, ale dodavatel ještě neposlal fakturu |
| **261** | Převody peněz | Odvod tržeb z pokladny do banky — obě strany si musí sednout |
| **314** | Zálohy | Zaplacená záloha vs interní doklad vs konečná faktura |
| **315** | Platební karty | Terminál nahlásil platbu, ale na výpisu z banky ještě není |
| **395** | Kontrolní | Uzávěrky, nenapárované úhrady, přeplatky — záchytná síť |

## 3. Klíčové parametry

### Frekvence kontrol

| Frekvence | Účty | Kolik |
|-----------|------|-------|
| **Denní** | 261/100, 261/211, 261/221, 315/100, 315/111, 395/000, 395/315 | 7 účtů |
| **Týdenní** | 131/100, 395/211, 395/221, 395/800 | 4 účty |
| **Měsíční** | 314/201 | 1 účet |

### Kdo odpovídá

- **Denní kontrola sald:** účetní (v rámci denních rutin po zpracování banky a pokladny)
- **Týdenní kontrola sald:** účetní (páteční rutina)
- **Měsíční kontrola sald:** účetní (před uzávěrkou DPH)
- **Eskalace neřešitelných rozdílů:** Jan Kutílek

:::danger Eskalace
Pokud položka visí a nevíš proč, nebo oprava vyžaduje zásah do starších období → eskaluj na Jana Kutílka. Neřeš to sama — špatná oprava může způsobit víc škody než neopravený stav.
:::

:::info
Na saldokonto existuje celkové schéma ve Figmě: [Schema SALDOKONTA](https://embed.figma.com/board/qNIx49vJTfp1YOZunGd39E/Schema-SALDOKONTA)
:::

## 4. Souvislosti a vazby

Saldokonto je kontrolní mechanismus **nad** ostatními finančními procesy. Když saldokonto nesvítí, znamená to problém v jednom z nich:

| Proces | Ovlivňuje saldokonto |
|--------|---------------------|
| Banka — výpisy, párování úhrad | 261/100, 261/221, 315/xxx, 395/221 |
| Pokladna — odvody tržeb, příjmy | 261/100, 261/211, 395/211 |
| Fakturace FP — přijaté faktury, DLP | 131/100 |
| Fakturace FV — vydané faktury, PK | 395/315 |
| Denní uzávěrka tržeb | 395/000 |

:::note Směr čtení
Problém v procesu → projeví se na saldokontu. Saldokonto samo o sobě nic neopravuje — je to diagnostický nástroj. Když saldokonto visí, hledej příčinu v procesu (banka, pokladna, fakturace), ne v saldokontu samotném.
:::

## 5. Zkušenosti a poučení

- **Nejčastější příčina:** neshoda VS — překlep, zůstal starý symbol, záměna VS dodáku a VS faktury
- **Druhá nejčastější:** nesedí partner — typicky u PK dokladů, kde se automaticky natáhne Wordline místo skutečného zákazníka
- **Přesmyčka v částce:** výjimečná, ale těžší k nalezení — pomáhá kontrola přes sestavu
- **Pondělní efekt:** účty 315/111 v pondělí sedí do nuly (weekend clearance) — v týdnu visí poslední 3–4 výpisy, což je OK

:::warning Pravidlo 2 měsíců
Pokud na 131/100 visí DLPR/DLPV déle než 2 měsíce → urgovat dodavatele. Delší čekání na dobropis není normální a signalizuje problém na straně dodavatele.
:::

## 6. Zdroje a reference

- [Schema SALDOKONTA — Figma](https://embed.figma.com/board/qNIx49vJTfp1YOZunGd39E/Schema-SALDOKONTA) — vizuální přehled všech účtů a vazeb
- Rutiny účetnictví (TODO) — checklisty kde je saldokonto součástí denní/týdenní/měsíční kontroly
- Banka (TODO) — postup párování bankovních výpisů
- Pokladna (TODO) — postup odvodů tržeb
- Fakturace FP (TODO) — postup generování faktur přijatých

---

## 📝 Co se změnilo

### Duben 2026 — Import do Mozkotronu
Migrace z Notion + Coda. Sloučeny duplicity ze 3 zdrojů, přidána 314/201 (zálohy) z Cody. Rozdělen do subpages per skupinu účtů. Doplněny sekce: proč to děláme, kdo odpovídá, zkušenosti.
`[nový dokument]` `[v2.0]`

| Verze | Datum | Autor | Popis změny |
|-------|-------|-------|-------------|
| 2.0 | 2026-04-23 | Jan Kutílek | Přepracování do KNOW šablony — 6 sekcí, TL;DR, odpovědnosti |
| 1.0 | 2026-04-23 | Jan Kutílek | Import z Notion + Coda do Mozkotronu |
