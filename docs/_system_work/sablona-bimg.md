# 📋 Šablona — BIMG (Big Image)

> Komplexní dokument pokrývající téma do hloubky. Vždy se tvoří jako první. Je „mateřský" dokument, ze kterého vychází SOP a CHL.

---

## Frontmatter

```yaml
---
title: "📜 Plný název tématu"
sidebar_label: "Krátký label"
sidebar_position: 1
description: "Jedna věta popisující obsah stránky"
category: law                    # law | proc | know | mem
layer: bimg                      # vždy bimg
audience: [firma]                # array z AOR: firma/management/finance/rust/nakup/prodej/sluzby/technologie
version: "1.0"
author: Jan Kutílek
date: 2026-04-22
---
```

**Poznámky:**
- `source_bimg` se NEUVÁDÍ — BIMG je kořen
- `audience` je array — může cílit na víc AOR skupin
- Emoji v `title` povinné

---

## Struktura dokumentu

```markdown
# Nadpis (shodný s title)

Úvodní odstavec — 2–3 věty, co čtenář v dokumentu najde a proč to potřebuje vědět.

## 🎯 Účel

Proč tento dokument existuje. Co řeší. Jaký problém adresuje.

## 📋 Obsah / Přehled

Hlavní tělo dokumentu. Struktura závisí na kategorii:

### Pro LAW (pravidla):
- Co platí, jaké jsou mantinely
- Kdo je odpovědný za dodržování
- Co se stane při porušení
- Kdy pravidlo vstupuje v platnost

### Pro PROC (procedury):
- Přehled procesu a jeho kroků (high-level, ne detailní)
- Kdo je vlastníkem procesu
- Jaké role se účastní
- Kde proces začíná a končí

### Pro KNOW (znalosti):
- Vysvětlení konceptu/technologie/produktu
- Klíčové parametry, srovnání, přehledy
- Kontext a souvislosti

### Pro MEM (záznamy):
- Co se stalo / rozhodlo
- Kdo byl přítomen / rozhodl
- Jaké jsou důsledky a akční body

## 🔗 Související dokumenty

- Odkazy na SOP vycházející z tohoto BIMG
- Odkazy na CHL vycházející z tohoto BIMG
- Odkazy na související BIMG v jiných AOR oblastech

## 📝 Historie změn

| Verze | Datum | Autor | Popis změny |
|-------|-------|-------|-------------|
| 1.0 | 2026-04-22 | Jan Kutílek | Počáteční verze |
```

---

## Pravidla formátu

- **Délka:** neomezená — BIMG pokrývá téma do hloubky
- **Subpages:** povolené — velká témata mohou mít podstránky
- **Diagramy:** Mermaid nativně podporovaný
- **Admonitions:** `:::info`, `:::tip`, `:::warning`, `:::danger`, `:::note`
- **Tabulky:** ano, kde to dává smysl
- **Obrázky:** ano, cesta `./img/nazev.png` (složka `img/` vedle .md)

---

## Příklad — LAW BIMG

```markdown
---
title: "⚖️ Reklamační řád"
sidebar_label: "Reklamační řád"
sidebar_position: 1
description: "Závazná pravidla pro vyřizování reklamací ve firmě Elektro Kutílek"
category: law
layer: bimg
audience: [firma]
version: "1.0"
author: Jan Kutílek
date: 2026-04-22
---

# ⚖️ Reklamační řád

Tento dokument definuje pravidla pro příjem, evidenci a vyřízení reklamací. Platí pro všechny zaměstnance.

## 🎯 Účel

Zajistit jednotný postup při reklamacích, dodržení zákonných lhůt a spokojenost zákazníků.

## 📋 Pravidla

### Lhůty
- Reklamace musí být přijata **ihned** při předložení zboží
- Rozhodnutí o reklamaci do **30 dnů**
- Zákonná záruční doba: **24 měsíců**

### Odpovědnost
- Příjem reklamace: **prodejce na prodejně**
- Evidence v Money S4: **prodejce**
- Rozhodnutí o opravě vs. výměně: **vedoucí prodejny**

:::warning
Odmítnutí přijmout reklamaci je porušení zákona. Vždy přijmi a zaeviduj.
:::

## 🔗 Související dokumenty

- [Postup vyřízení reklamace](./reklamace-sop) — SOP krok za krokem
- [Quick ref reklamační lhůty](./reklamace-chl) — CHL cheat list
```

---

*Šablona v2.0 — aktualizováno 2026-04-23 (R017: sop→proc v kategoriích)*
