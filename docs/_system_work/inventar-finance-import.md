# Inventář importu: Oblast FINANCE

**Vytvořeno:** 2026-04-23
**Zdroje:** Notion WIKI společná (ZIP), Coda Finance 1 (353 stran PDF), Coda Finance 2 (262 stran PDF)
**Stav v Mozkotronu:** 4 prázdné placeholder složky (cashflow, ekonomický model, náklady, účetnictví)

---

## Přehled zdrojů

| Zdroj | Formát | Rozsah | Poznámka |
|-------|--------|--------|----------|
| Notion WIKI společná | ZIP → MD + PNG | 176 MD souborů celkem, z toho ~45 finance | Čistý markdown, obrázky jako ClickUp linky (většina mrtvé) |
| Coda Finance 1 | PDF 353 stran | Starší verze — flat wiki, vše v jednom | Obsahuje screenshoty s anotacemi přímo v PDF |
| Coda Finance 2 | PDF 262 stran | Novější — strukturovaná do 8 kapitol | Přeorganizovaná verze Finance 1 + nový obsah (mzdy 2026) |

### Vztah Coda Finance 1 vs Finance 2

Finance 2 je **reorganizovaná a rozšířená verze** Finance 1. Finance 2 má jasnou strukturu do 8 kapitol:

1. Přehled & Dashboard
2. Rutiny & Checklisty
3. Bankovní operace
4. Pokladny
5. Fakturační procesy
6. DPH
7. Mzdy
8. Archivace

Finance 1 obsahuje tentýž obsah, ale nestrukturovaně — navíc má na konci testovací stránky. **Pro import preferovat Finance 2** jako základ struktury, Finance 1 použít jen pokud v F2 něco chybí.

---

## Tématické bloky (navržené pro blokovou validaci)

### BLOK A: Rutiny účetnictví
**Počet zdrojových dokumentů:** ~5 (Notion) + opakováno v obou Coda PDF
**Duplicity:** Vysoké — tentýž obsah v Notionu i obou Coda verzích
**Kvalita:** Střední — existují podrobné checklisty, ale místy nekompletní (měsíční rutiny mají prázdné položky)
**Obsah:**
- Denní rutiny (banka, pokladna, fakturace, saldo)
- Týdenní rutiny (DLP kontroly, FP kontroly, saldo)
- Měsíční rutiny (ZF ČEZ, fakturace, saldo)
- Kontroly před uzavřením DPH
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/`

### BLOK B: Banka
**Počet zdrojových dokumentů:** 9 (Notion) + opakováno v Coda
**Duplicity:** Vysoké
**Kvalita:** Dobrá — podrobné postupy se screenshoty, jasná struktura use-casů
**Obsah:**
- Princip bankovních výpisů (pravidla, číselné řady, párování)
- Ruční stažení PKO výpisů
- Poloautomatické stažení BV/PK výpisů
- 6 kategorií položek (úhrady, převody, vklady, poplatky, PK, příkazy)
- Use-casy: vklad hotovosti, převod tržeb, přeplatek, vratka
- Bankovní výpisy — PDF výpisy (detailní postup)
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/banka/`
**Poznámka:** Screenshoty v Notionu jsou ClickUp linky (mrtvé). Coda PDF má screenshoty přímo v sobě.

### BLOK C: Pokladna
**Počet zdrojových dokumentů:** 7 (Notion) + USE CASY P0 + opakováno v Coda
**Duplicity:** Vysoké — postup odvodu tržeb existuje v 3 různých variantách
**Kvalita:** Dobrá — podrobné, ale duplikáty se místy liší v detailech
**Obsah:**
- Systém pokladen (P0 hlavní, P1-P3 prodejní, P5 dodavatelé, P6 rozvoz)
- Odvod tržeb z pokladen do P0
- Odvod tržeb z P0 do banky
- Příjem hotovosti za FV
- Příjem tržeb do P0
- Nákladové doklady a paragony
- USE CASY POKLADNA P0 (příjem z kas, odvod do banky)
- Výměna drobných
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/pokladna/`

### BLOK D: Fakturace — Faktury vydané (FV)
**Počet zdrojových dokumentů:** 7 (Notion) + opakováno v Coda
**Duplicity:** Střední
**Kvalita:** Dobrá — hierarchický postup (skupiny → hlavička → položky → operace → úhrada)
**Obsah:**
- Kdy potřebuji FV (pravidla)
- Dva způsoby tvorby (ručně, přebírkou)
- Postup FV: výběr skupiny, hlavička, položky, operace po FV, úhrada
- Úhrada FV kartou (detailní postup se screenshoty)
- FV chyby
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/fakturace-fv/`

### BLOK E: Fakturace — Faktury přijaté (FP)
**Počet zdrojových dokumentů:** 5+ (Notion) + rozšířeno v Coda (FP0-FP4 kompletně)
**Duplicity:** Střední — Notion má kostru, Coda detaily
**Kvalita:** V Coda velmi dobrá — podrobné postupy se screenshoty per typ faktury
**Obsah:**
- FP obecně (položkové vs hlavičkové, třídění do řad)
- FP0 — přeprodej služeb
- FP1 — zbožové faktury (generování, reverse charge, EUR)
- FP2 — režijní faktury (se seznamem webů dodavatelů)
- FP3 — dobropisy/reklamace (skladové, zákaznické, reverse)
- FP4 — cenové dobropisy/bonusy, ochrana skladu
- Zálohové faktury přijaté (ZFP + interní doklady)
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/fakturace-fp/`

### BLOK F: Saldokonto
**Počet zdrojových dokumentů:** 1 velký (Notion) + opakováno v Coda
**Duplicity:** Nízké — jeden autoritativní dokument
**Kvalita:** Velmi dobrá — každý účet má: požadovaný stav, strany, typické chyby, frekvenci
**Obsah:**
- 131/100 — DLP vs FP (sklady)
- 261/100 — odvody tržeb do banky
- 261/211 — převody mezi pokladnami
- 261/221 — převody mezi bankami
- 314/xxx — zálohy
- 315/100 — PK mezi PHDK a BV
- 315/111 — převody čistých částek PKO → BV
- 395/000 — pokladní uzávěrky
- 395/211 — nenapárované úhrady pokladna
- 395/221 — nenapárované úhrady banka
- 395/315 — PK mezi ID a PHDK
- 395/800 — přeplatky a vratky
- Figma schema saldokonta (odkaz)
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/saldokonto/`

### BLOK G: Denní uzávěrka tržeb
**Počet zdrojových dokumentů:** 1-2 (Notion) + Coda rozšířeně
**Duplicity:** Střední
**Kvalita:** Dobrá — rozlišuje roli prodejce vs kancelář
**Obsah:**
- Prodejci: UZ v PSQL, přenesení prodejek, uzávěrka, odvodový doklad
- Kancelář: příjmový doklad do P0, saldo 261/211, poukazy
- Schema (obrázek)
- Dokumenty co se předávají (výčetka, hotovost, účtenky PK, poukazy)
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/dennni-uzaverka/`

### BLOK H: Daně a roční povinnosti
**Počet zdrojových dokumentů:** 5 (Notion) + opakováno v Coda
**Duplicity:** Vysoké
**Kvalita:** Střední — postupy existují, ale některé jen jako osnova
**Obsah:**
- Vyúčtování daně z příjmů ze závislé činnosti (1A)
- Vyúčtování daně z příjmů srážkové (1B)
- Roční zůčtování daně RZD (2)
- DP za FO
- Mechanika výpočtu daní
- Daňové úlevy (2024)
- Roční vyúčtování ČEZ
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/dane/`

### BLOK I: Mzdy
**Počet zdrojových dokumentů:** v Coda obou verzích
**Duplicity:** Finance 2 má novější data (2026)
**Kvalita:** Střední až dobrá — výpočet mzdy krok za krokem, ale specifická jména zaměstnanců v příkladech
**Obsah:**
- Mzdové povinnosti (ELDP, přehledy, oznámení)
- Výpočet mzdy (krok za krokem)
- Exekuce na plat (postup, výpočet srážek)
- OČR / Otcovská / Nemocenská / Mateřská
- Propustky k lékaři
- Novinky mzdové povinnosti 2026
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/mzdy/`
**Poznámka:** Obsahuje reálná jména zaměstnanců — zatím ponechat, Jan je může potřebovat.

### BLOK J: Odbytové procesy (DLV, Prodejky, Poukazy)
**Počet zdrojových dokumentů:** 3-5 (Notion + Coda)
**Duplicity:** Střední
**Kvalita:** Střední
**Obsah:**
- DLV — dodací list vydaný (postup, skupiny, partneři)
- Prodejky v Money — zaúčtování
- Emitace poukazů (postup tvorby, tisku, přijímání)
**Cílová složka v Mozkotronu:** `05-prodej/` (rozhodnuto — nepatří do finance)

### BLOK K: Archivace
**Počet zdrojových dokumentů:** 1 (Notion) + Coda
**Duplicity:** Nízké
**Kvalita:** Nízká — spíš pravidla než postup
**Obsah:**
- Archivační pravidla
- Dodávka 2024 schema (Figma odkaz)
**Cílová složka v Mozkotronu:** `02-finance/ucetnictvi/archivace/`

---

## Souhrn

| Metrika | Hodnota |
|---------|---------|
| Celkem tématických bloků | 11 (A–K) |
| Celkem zdrojových dokumentů (Notion) | ~45 |
| Celkem stran Coda (obě verze) | 615 |
| Odhadovaný počet výsledných Mozkotron dokumentů | 25–35 |
| Duplicitní obsah (odhad) | ~60 % |
| Nepoužitelný obsah (prázdné, testovací) | ~10 % |
| Nutná anonymizace | Blok I (mzdy) |
| Sporné zařazení do AOR | Blok J (odbyt — finance vs prodej?) |

## Mrtvé screenshoty

Notion export odkazuje na ClickUp CDN (`t4612515.p.clickup-attachments.com`). Tyto obrázky jsou pravděpodobně nedostupné. **Coda PDF obsahuje screenshoty přímo** — použít je jako zdroj obrázků.

## Doporučený postup

1. Začít blokem, který má nejvyšší kvalitu a nejnižší duplicity → **BLOK F (Saldokonto)** nebo **BLOK D (FV)**
2. Pokračovat bloky s jasnou strukturou → B (Banka), C (Pokladna), E (FP)
3. Rutiny (A) a Uzávěrku (G) zpracovat po blocích B-E, protože na ně odkazují
4. Daně (H) a Mzdy (I) jako samostatné bloky
5. Sporný blok J rozhodnout s Janem (finance vs prodej)
6. Archivaci (K) na konec — málo obsahu
