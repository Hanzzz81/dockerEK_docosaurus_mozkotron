# 📋 Pravidla projektu — Tvorba obsahu Mozkotron

> Živý dokument. Každé rozhodnutí, které Jan učiní v rámci tohoto projektu, se sem zapíše. Claude to dělá automaticky — Jan nemusí připomínat.

**Projekt:** Plnění Mozkotronu postupy a informacemi
**Workspace:** `docs/` v `XPR0_docker_mozkotron`
**Datum založení:** 2026-04-22

---

## 📁 Rozhodnutí o struktuře

### R001 — Nultá úroveň podle AOR (2026-04-22)
Hlavní členění docs/ kopíruje AOR oblasti firmy: 00-firma, 01-management, 02-finance, 03-rust, 04-nakup, 05-prodej, 06-dodani, 07-technologie.

### R002 — Druhá úroveň = tematické bloky (2026-04-22)
Uvnitř každé AOR oblasti jsou tematické bloky odpovídající pilířům AOR Paláce v4.0. Celkem 27 bloků. Bloky jsou předpřipravené v `_structure.json`, fyzicky založené s `_category_.json`.

### R003 — Naming bez diakritiky (2026-04-22)
Složky a soubory v kebab-case bez diakritiky. Diakritika OK v `title` ve frontmatter. Potvrzeno proti rozhodnutí v `architektura-knowledge-base.md`.

---

## 🗂️ Rozhodnutí o workspace

### R004 — Pracovní soubory do _system_work/ (2026-04-22)
Root docs/ je výhradně pro Docusaurus content. Vše pro naše interní potřeby (workflow vizualizace, pracovní pomůcky, tento soubor) jde do `_system_work/`. Docusaurus složky s podtržítkem ignoruje.

### R005 — Každé rozhodnutí se zapisuje (2026-04-22)
Když Jan rozhodne cokoliv v rámci tohoto projektu, Claude to okamžitě zapíše do tohoto souboru jako nové pravidlo s číslem, datem a kontextem. Nespoléhat jen na systémovou paměť — pravidla musí být čitelná i pro člověka, i pro budoucího Clauda.

---

## ✍️ Rozhodnutí o tvorbě obsahu

### R006 — Editor nedělá parametry ani formát (2026-04-22)
Editor (člověk) dodává pouze potřebu (krok 1) a vstupy (krok 2). Parametry dokumentu (typ, formát, umístění, metadata) jsou systémová pravidla aplikovaná strojově Claudem. Editor nevolí, jestli to bude BIMG/SOP/CHL — to vyplývá z rozhodovacího stromu. Editor neřeší formátování — to je constraintováno.

### R007 — Claude je tvůrce dokumentů (2026-04-22)
Psaní textu dokumentů (krok 5) dělá Claude, ne editor. Editor dodá znalost a kontext, Claude z toho vytvoří dokument ve správném formátu. Editor pak kontroluje jen věcnou správnost.

### R008 — Typ dokumentu se určuje strojově (2026-04-22)
Rozhodovací strom pro typ dokumentu:
- Téma nemá žádnou dokumentaci → **BIMG** (vždy první)
- Existuje BIMG + konkrétní postup pro roli → **SOP**
- Existuje BIMG + SOP + potřeba rychlé reference → **CHL**
- Závazné pravidlo napříč firmou → **LAW**
- Expertní znalost → **KNOW**

### R009 — Workflow má 5 rolí (2026-04-22)
Workflow tvorby obsahu zahrnuje 5 účastníků:
1. **Editor** (člověk) — dodává potřebu a vstupy
2. **Systém** (pravidla) — centrální constrainty, které nikdo neohýbá
3. **Claude** (AI) — analyzuje, aplikuje constrainty, tvoří, publikuje
4. **Architekt** (Jan) — schvaluje, řeší spory, udržuje pravidla
5. **Čtenář** (zaměstnanec) — konzumuje obsah, dává zpětnou vazbu

---

## 🔧 Technická rozhodnutí

### R010 — Progress dashboard jako HTML s auto-refresh (2026-04-22)
Ke každému projektu Claude na začátku nabídne založení `progress.html` — interaktivní HTML dashboard s auto-refresh (5s). Uživatel si ho otevře v prohlížeči (ideálně na druhém monitoru) a vidí live změny bez refreshe. Claude edituje datovou sekci v HTML při každém progressu. Toto je standard pro všechny projekty — pravidlo zapsáno do DNA firmy jako `Standard_progress_dashboard.md`.

### R014 — Audience = AOR oblasti (2026-04-22)
Povolené hodnoty `audience` ve frontmatter odpovídají AOR oblastem firmy:
`firma` | `management` | `finance` | `rust` | `nakup` | `prodej` | `sluzby` | `technologie`

Kde `firma` = průřezový dokument viditelný pro všechny. Pole `audience` je array — dokument může cílit na víc skupin: `audience: [nakup, sluzby]`.

Poznámka: AOR oblast `dodani` se přejmenovává na `sluzby` (S — Služby a doručení produktu). Až bude přejmenování hotové v AOR projektu, aktualizovat i zde.

### R015 — source_bimg jako slug (2026-04-22)
Pole `source_bimg` ve frontmatter odkazuje na mateřský BIMG dokument pomocí slugu (název souboru bez přípony):
- **Povinné** pro `layer: sop` a `layer: chl` — každý SOP/CHL musí odkazovat na svůj BIMG
- **Neplatí** pro `layer: bimg` — BIMG je kořen, nemá rodiče
- **Formát:** slug, např. `source_bimg: prodejni-proces-bimg`
- **Použití:** kaskádová revize — změna BIMG → Claude najde všechny SOP/CHL se stejným `source_bimg` a nabídne revizi

### R016 — Validace frontmatter (2026-04-22)
Claude validuje kompletnost frontmatter před publikací. Nekompletní dokument se nepublikuje.
- **Vždy povinné:** `title`, `sidebar_label`, `sidebar_position`, `description`, `category`, `layer`, `audience`, `version`, `author`, `date`
- **Podmíněně povinné:** `source_bimg` — jen pro `layer: sop` a `layer: chl` (R015)
- **Validace probíhá:** při tvorbě dokumentu (krok 7 workflow). Pokud chybí pole, Claude se doptá editora/manažera.
- Docusaurus nativně frontmatter nevaliduje → odpovědnost je na Claudovi.

### R011 — Dvouosý model: category × layer (2026-04-22, aktualizace R017/R019)

Každý dokument v Mozkotronu má dvě nezávislé osy:

**Osa X — KATEGORIE (co čtenář hledá):**

| Kód | Čtenář vidí | Otázka | Příklad |
|-----|-------------|--------|---------|
| `law` | 📜 Co platí | Co musím dodržet? | „Nosíš firemní oblečení při kontaktu se zákazníkem" |
| `know` | 💡 Proč to tak je | Proč to dává smysl? | „Zákazník pozná zaměstnance, profesionalita, značka" |
| `proc` | 🔧 Jak to udělat | Jak to provedu? | „Výdej oblečení — kdo změří, kolik kusů, formulář" |
| `mem` | 📝 Co se změnilo | Co se stalo a proč? | „Duben 2026: přidány softshellky místo vest" |

- `law` = závazné pravidlo, porušení = průšvih
- `know` = kontext, data, zkušenost — podklad pro rozhodování
- `proc` = opakovaný proces, procedura krok za krokem (dříve `sop`, přejmenováno R017 kvůli kolizi s vrstvou SOP)
- `mem` = žurnál per tematický blok — deník rozhodnutí a událostí (ne samostatný dokument, viz R019)

**Osa Y — VRSTVA (jak hluboký dokument):**

| Kód | Název | Délka | Kdy vzniká |
|-----|-------|-------|------------|
| `bimg` | Big Image | Bez limitu, subpages povolené | Vždy jako první — kompletní pokrytí tématu |
| `sop` | SOP (postup) | Bez limitu, řídí se tématem (R018) | Když existuje konkrétní postup per role |
| `chl` | Cheat List | Krátký (1–2 strany) | Volitelně, zkrácená verze nad obsáhlejším SOP |

**Proč dvě osy:**
Kategorie říká CO čtenář hledá (pravidlo? kontext? postup?). Vrstva říká JAK HLUBOKO se dokument noří. Ze stejného tématu může vzniknout LAW BIMG (kompletní pravidla), LAW SOP (postup dodržování) i KNOW BIMG (proč to tak je). Osy jsou nezávislé.

**Proč české nadpisy pro čtenáře:**
Interní kódy (law/know/proc/mem) zůstávají ve frontmatter pro systém. Ale čtenář na stránce vidí českou otázku — „Co platí", „Proč to tak je", „Jak to udělat", „Co se změnilo" — která mu okamžitě řekne, co v dokumentu najde. Žádné technické zkratky pro koncového uživatele.

**Princip „zákon, ne zákon + novela" (R019):**
Dokumenty v Mozkotronu jsou vždy aktuální a kompletní k danému datu. Když se změní pravidlo, přepíše se dokument (verze 1.0 → 1.1). Předchozí verze zůstane v historii. Čtenář vždy vidí platný stav — nikdy nečte „základ + novely". MEM (žurnál) zaznamenává PROČ se něco změnilo, ale samotná změna je vždy zapsaná v příslušném LAW/KNOW/PROC dokumentu.

**Čtyři pohledy na jedno téma:**
Každé téma má potenciálně čtyři pohledy pohromadě v jednom tematickém bloku:
1. 📜 **Co platí** — pravidla a mantinely
2. 💡 **Proč to tak je** — kontext, data, logika za rozhodnutím
3. 🔧 **Jak to udělat** — konkrétní postup per role
4. 📝 **Co se změnilo** — žurnál rozhodnutí a událostí

Zaměstnanec tak k jednomu tématu najde odpověď na jakoukoli otázku, aniž by musel hledat v jiných sekcích.

### R012 — Intake workflow přes Cowork + Synology (2026-04-22)
**Strategické rozhodnutí:** Vstupní brána pro tvorbu obsahu je Cowork desktop + sdílený Synology folder. Webový formulář nad Docusaurem se nestaví (Plan B zrušen, tohle je Plan A).

**Architektura:**
- Synology Drive sdílí `XPR0_docker_mozkotron/docs/` všem editorům (read/write)
- Každý editor má na svém počítači Cowork desktop
- V `docs/_system_work/` leží manifest (`CLAUDE.md`) — vstupní brána, kterou Claude čte na začátku každé session
- Manifest definuje intake dialog: Claude se ptá strukturovaně (kategorie → téma → audience → vstupy → validace)
- Když se manifest změní, všem uživatelům se při další session změní workflow

**Tok dat:**
1. Editor otevře Cowork → připojí Synology folder
2. Claude přečte manifest → spustí intake dialog
3. Editor odpovídá na strukturované otázky (AskUserQuestion)
4. Claude validuje kompletnost vstupů
5. Claude zpracuje obsah podle constraintů (R006–R009)
6. Výsledek se zapíše přímo do docs/ na Synology → všichni vidí

**Co zajistí konzistenci:**
- Jeden manifest = jeden workflow pro všechny
- Frontmatter kontrakt (R011) = validace povinných polí
- Průvodce kategoriemi = tréninkový materiál pro editory
- `_structure.json` = sdílený stav (kdo co vytvořil, co existuje)

**Kdo rozhoduje co:**
- Editor rozhoduje: kategorie (law/sop/know/mem), téma, audience, dodá vstupy
- Claude rozhoduje: layer (bimg/sop/chl), formátování, umístění, frontmatter
- Manažer (Jan) schvaluje: review hotového dokumentu

### R013 — Standardy jako DNA dokumenty (2026-04-22)
Cross-projektové standardy se ukládají do DNA firmy (`00 - Elektro Kutílek - DNA firmy/`):
- `Standard_progress_dashboard.md` — progress HTML
- `Standard_komunikace_Claude.md` — trojbloková komunikace
- `Standard_pruvodce.md` — interaktivní Průvodce pro komplexní témata

Projektově specifické kopie v `_system_work/` slouží jako reference, DNA verze je master.

### R017 — Přejmenování kategorie SOP → PROC (2026-04-22)
Kategorie `sop` ve frontmatter se přejmenovává na `proc` (procedura/proces), aby nedocházelo ke kolizi s vrstvou `sop` (Standard Operating Procedure jako formát dokumentu).

Nové hodnoty osy **category**: `law` | `proc` | `know` | `mem`

- `law` = závazné pravidlo, porušení = průšvih
- `proc` = opakovaný proces, procedura
- `know` = expertní znalost pro rozhodování
- `mem` = žurnál (viz R019)

### R018 — Zrušení limitu délky SOP (2026-04-22)
Vrstva `sop` (Standard Operating Procedure) nemá limit na délku. Délka se řídí tématem:
- Faktura vydaná = 6 stránek se screenshoty, větvením
- Založení položky do rozvozu = půl stránky
- Formát SOP: text + obrázky/screenshoty + volitelně vývojový diagram jako alternativní vizualizace

Starý constraint „max 1 obrazovka" se ruší — byl odvozen z jednoho use case, ne z obecného pravidla.

### R019 — Princip „zákon, ne zákon + novela" (2026-04-22)
Dokumenty v Mozkotronu jsou vždy **aktuální a kompletní k danému datu**. Žádné přílepky, novely, dodatky.

**Pravidla:**
- Když se změní pravidlo/postup/znalost → přepíše se dokument, zvýší se verze
- Předchozí verze zůstane dostupná v historii (verzování)
- Bude highlightované, co se změnilo oproti předchozí verzi
- Čtenář vždy vidí platný stav — nikdy nemusí číst „základ + 3 novely"

**MEM jako žurnál:**
Kategorie `mem` není plnohodnotný typ dokumentu na úrovni LAW/PROC/KNOW. Je to **žurnál bokem** — deník rozhodnutí a událostí, který zaznamenává PROČ se něco změnilo. Samotná změna se vždy zapíše do příslušného LAW/PROC/KNOW dokumentu. Status MEM v systému bude ještě upřesněn.

---

*Poslední aktualizace: 2026-04-22*
