---
title: "🏗️ Architektura Knowledge Base"
sidebar_label: "Architektura KB"
sidebar_position: 1
description: "Kanonická definice struktury, typů dokumentů, frontmatter kontraktu a přístupových pravidel pro Mozkotron"
type: law
audience: [firma]
version: "1.0"
author: Jan Kutílek
date: 2026-04-21
---

# 🏗️ Architektura Knowledge Base (Mozkotron)

> Kanonický dokument. Definuje fyzickou strukturu docs/, typy dokumentů, frontmatter kontrakt a pravidla přístupu. Čtou ho: auth modul, editor, admin satelit, Claude API.

:::danger Systémový dokument
Tento soubor je v `_system_hidden/` — nerendruje se v sidebaru. Změny v něm ovlivňují chování celého systému. Edituje pouze architekt.
:::

---

## 📁 Fyzická struktura docs/

```
docs/
├── _system_hidden/                     ← ⚙️ systémové dokumenty (nerendrují se)
│   ├── architektura-knowledge-base.md  ← TENTO SOUBOR
│   ├── _structure.json                 ← registr všech dokumentů
│   └── ...                             ← další systémová konfigurace
│
├── firma/                              ← 📜 průřezové (platí pro všechny)
├── finance/                            ← 💰 AOR Finance
│   └── {tema}/                         ← podsložka per téma
│       ├── bimg-{tema}.md
│       ├── sop-{tema}-{upřesnění}.md
│       └── chl-{tema}.md
├── prodej/                             ← 🛒 AOR Prodej
├── sklad/                              ← 📦 AOR Sklad
├── servis/                             ← 🔧 AOR Servis
├── elektro/                            ← ⚡ AOR Elektro
└── management/                         ← 🏢 AOR Management
```

### Pravidlo pro `_system_hidden/`

Složky s prefixem `_` Docusaurus standardně ignoruje v sidebaru. V konfiguraci (`docusaurus.config.js`) ověřit, že `sidebarItemsGenerator` explicitně vynechává `_system_hidden/**`. Obsah je přístupný přes přímý URL pouze pro architekta.

---

## 📋 Typy dokumentů

| Typ | Prefix souboru | Účel | Výchozí viditelnost |
|---|---|---|---|
| 📖 **BIMG** | `bimg-` | Kompletní master dokument. Architektura procesu, kontext, rozhodnutí, vazby. Zdroj pravdy, ze kterého se derivuje vše ostatní. | Architekt, management |
| 📝 **SOP** | `sop-` | Zkrácený postup pro konkrétní roli. Derivát z BIMG — zaměřený na "co dělat, krok za krokem". | Správci + cílová audience |
| 📄 **CHL** | `chl-` | Cheat list / tahák. Stručná reference na jednu stránku. | Všichni v daném AOR |
| 📜 **LAW** | `law-` | Závazné firemní pravidlo, platí průřezově. | Všichni |
| 💡 **KNOW** | `know-` | Znalostní dokument (produkt, technologie, trh). | Dle audience |

### Derivační řetězec

```
BIMG (master)
  ↓ derivace pro konkrétní roli
SOP (postup)
  ↓ zhuštění na tahák
CHL (cheat list)
```

Každý SOP a CHL musí mít v frontmatter odkaz `source_bimg` na svůj master dokument.

---

## 🏷️ Frontmatter kontrakt

Každý MD soubor v docs/ **musí** obsahovat tyto povinné frontmatter fieldy. Systémové moduly (auth, editor, admin satelit) je čtou programově.

### Povinná pole

```yaml
---
title: "📦 Reklamace — postup pro prodejce"    # [STRING] plný název s emoji
sidebar_label: "Reklamace (prodejce)"           # [STRING] krátký label pro sidebar
sidebar_position: 1                             # [INT] pořadí v rámci sekce
description: "Stručný popis dokumentu"          # [STRING] 1 věta, pro index a SEO
type: sop                                       # [ENUM] bimg | sop | chl | law | know
audience: [prodej]                              # [ARRAY] prodej | sklad | servis | finance | elektro | management | firma
version: "1.0"                                  # [STRING] sémantické verzování
author: Jan Kutílek                             # [STRING] vlastník obsahu
date: 2026-04-21                                # [DATE] YYYY-MM-DD, poslední revize
---
```

### Volitelná pole

```yaml
---
source_bimg: prodej/reklamace/bimg-reklamace     # [PATH] relativní cesta k master BIMG (povinné pro SOP a CHL)
tags: [reklamace, zakaznik, vraceni]             # [ARRAY] volné tagy pro vyhledávání
status: draft | review | published | archived    # [ENUM] stav dokumentu
review_date: 2026-07-21                          # [DATE] datum příští revize
---
```

---

## 🔐 Řízení přístupu — kontrakt pro auth modul

Auth modul čte z frontmatter dvě pole: `type` a `audience`. Rozhoduje podle dvou os:

### Osa 1 — Hloubka (pole `type`)

Definuje, jaké typy dokumentů role vidí:

```
ROLE_ARCHITECT:  [bimg, sop, chl, law, know]    # vidí vše
ROLE_ADMIN:      [sop, chl, law, know]           # bez BIMG
ROLE_USER:       [sop, chl, law, know]           # bez BIMG
```

### Osa 2 — Oblast (pole `audience`)

Definuje, jaké oblasti firmy role pokrývá:

```
ROLE_ARCHITECT:  ["*"]                           # všechny oblasti
ROLE_ADMIN:      ["*"]                           # všechny oblasti
group_prodej:    ["firma", "prodej"]             # průřezové + své AOR
group_sklad:     ["firma", "sklad"]
group_servis:    ["firma", "servis"]
group_finance:   ["firma", "finance"]
group_elektro:   ["firma", "elektro"]
group_management:["firma", "management"]
```

### Rozhodovací logika (pseudokód)

```
function canUserSeeDocument(user, document):
    doc_type = document.frontmatter.type
    doc_audience = document.frontmatter.audience

    # Osa 1: má role přístup k tomuto typu?
    if doc_type NOT IN user.role.allowed_types:
        return FALSE

    # Osa 2: patří uživatel do audience dokumentu?
    if user.role.audience == ["*"]:
        return TRUE
    if ANY(doc_audience) IN user.role.audience:
        return TRUE

    return FALSE
```

---

## 📝 Kontrakt pro editor (budoucí modul)

Editor bude nabízet:

1. **Výběr typu** — dropdown: BIMG / SOP / CHL / LAW / KNOW
2. **Výběr audience** — multi-select: prodej, sklad, servis, finance, elektro, management, firma
3. **Source BIMG** — pokud typ = SOP nebo CHL, povinný výběr master dokumentu
4. **Automatické pole** — `date` se nastaví na aktuální datum, `version` se inkrementuje
5. **Validace** — editor nepustí uložení bez povinných frontmatter polí

### Co editor čte z tohoto dokumentu:

| Pole | Odkud | Účel |
|---|---|---|
| Povolené `type` hodnoty | Sekce "Typy dokumentů" | Naplní dropdown typu |
| Povolené `audience` hodnoty | Sekce "Řízení přístupu" | Naplní multi-select audience |
| Frontmatter šablona | Sekce "Frontmatter kontrakt" | Validuje povinná pole |
| Derivační řetězec | Sekce "Typy dokumentů" | Nabídne "vytvořit SOP z tohoto BIMG" |

---

## 🤖 Kontrakt pro Claude API (admin satelit)

Když Claude API dostane požadavek na vytvoření nebo úpravu dokumentu:

1. **Přečte tento soubor** → zjistí aktuální strukturu, typy, frontmatter kontrakt
2. **Přečte `_structure.json`** → zjistí existující dokumenty a pozice
3. **Vytvoří / aktualizuje MD** s kompletním frontmatter podle kontraktu
4. **Aktualizuje `_structure.json`** → přidá nový dokument do registru

### Derivace

Když Claude aktualizuje BIMG:
1. Najde všechny dokumenty kde `source_bimg` ukazuje na tento BIMG
2. Přegeneruje je podle aktuálního obsahu BIMG
3. Inkrementuje `version`, aktualizuje `date`
4. Zapíše do `_structure.json`

---

## 🗺️ Pojmenování souborů

- **Složky AOR:** kebab-case, bez diakritiky (`finance`, `prodej`, `sklad`)
- **Podsložky témat:** kebab-case, bez diakritiky (`fakturace`, `reklamace`)
- **Soubory:** `{type}-{tema}.md` nebo `{type}-{tema}-{upřesnění}.md`
- **Diakritika:** povolena v `title` a `sidebar_label` ve frontmatter, zakázána v názvech souborů a složek
- **`_system_hidden/`:** prefix `_` = nerendruje se v Docusaurus sidebaru

---

## 📊 Registr `_structure.json`

Soubor `_system_hidden/_structure.json` eviduje všechny dokumenty v docs/. Slouží jako rychlý index pro Claude API a editor — aby nemusely procházet filesystem.

```json
{
  "last_updated": "2026-04-21",
  "updated_by": "Claude",
  "sections": [
    {
      "path": "prodej/reklamace",
      "label": "🛒 Reklamace",
      "documents": [
        {
          "file": "bimg-reklamace.md",
          "type": "bimg",
          "audience": ["prodej"],
          "version": "1.0",
          "sidebar_position": 1
        },
        {
          "file": "sop-reklamace-prodejce.md",
          "type": "sop",
          "audience": ["prodej"],
          "source_bimg": "bimg-reklamace.md",
          "version": "1.0",
          "sidebar_position": 2
        }
      ]
    }
  ]
}
```

---

*Systémový dokument — edituje pouze architekt. Změny ovlivňují auth modul, editor a Claude API.*
