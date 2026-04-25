# 📊 Progres projektu — Tvorba obsahu Mozkotron

> Trvalý seznam toho, co musíme spolu zadefinovat, aby workflow fungoval. Claude ho aktualizuje průběžně. Jan vidí vždy aktuální stav.

**Projekt:** Plnění Mozkotronu postupy a informacemi
**Založeno:** 2026-04-22
**Poslední aktualizace:** 2026-04-22

---

## ✅ Hotovo

- [x] **Struktura wiki** — 8 AOR oblastí, 27 tematických bloků, `_structure.json`, `_category_.json` soubory
- [x] **Naming konvence** — kebab-case bez diakritiky, `{type}-{tema}.md` (R003)
- [x] **Rozhodovací strom typů** — BIMG → SOP → CHL → LAW → KNOW (R008)
- [x] **Role ve workflow** — Editor, Systém, Claude, Manažer, Čtenář (R009)
- [x] **Editor neřeší parametry** — typ, formát, umístění jsou strojové (R006)
- [x] **Claude píše dokumenty** — editor dodá znalost, Claude tvoří (R007)
- [x] **Vizualizace workflow** — swimlane tabulka + flow diagram (2 HTML soubory)
- [x] **Pravidla projektu** — `pravidla-projektu.md` s automatickým zápisem rozhodnutí (R005)

---

## 🔶 Rozpracováno / potřebuje dopilovat

- [ ] **Frontmatter kontrakt** — 10 polí je navržených, ale potřebujeme:
  - [ ] Finalizovat povolené hodnoty pro `type` (bimg, sop, chl, law, know — je to kompletní?)
  - [ ] Finalizovat povolené hodnoty pro `audience` (firma, management, finance, rust, nakup, prodej, dodani, technologie — je to kompletní?)
  - [ ] Rozhodnout: je `source_bimg` povinné i pro BIMG a LAW? (logicky ne — ale upřesnit)
  - [ ] Validační pravidla — co se stane, když frontmatter chybí pole?

- [ ] **Šablona dokumentu pro každý typ** — jak přesně vypadá:
  - [ ] BIMG šablona (pages + subpages, Markdown struktura)
  - [ ] SOP šablona (checklist, max 1 obrazovka)
  - [ ] CHL šablona (1×A4, tabulka/diagram)
  - [ ] LAW šablona
  - [ ] KNOW šablona

---

## 🔴 Ještě nezačato — musíme zadefinovat

### Blok A: Systémové constrainty (tvrdá pravidla)

- [ ] **Přístupová matice** — kdo vidí jaký typ × audience:
  - [ ] Mapování rolí zaměstnanců na audience skupiny
  - [ ] Jak se řeší "celá firma" vs. "jen management"
  - [ ] Jak se technicky realizuje v Docusauru (plugin? frontmatter filtr?)

- [ ] **Registr existujících BIMG** — jak Claude pozná, zda téma už má BIMG:
  - [ ] Bude to v `_structure.json`? Nebo skenováním souborů?
  - [ ] Struktura záznamu (téma → soubor → status: draft/published)

- [ ] **Kaskádová revize** — pravidla:
  - [ ] Jak najít deriváty (pole `source_bimg` ve frontmatter)
  - [ ] Co přesně se reviduje (celý text, nebo jen kontrola konzistence?)
  - [ ] Automaticky nebo na vyžádání?

### Blok B: Intake proces (jak editor zadává)

- [ ] **Intake formulář / šablona** — co přesně editor vyplní:
  - [ ] Bude to ve webovém formuláři v Mozkotronu?
  - [ ] Nebo prostě napíše Claudovi?
  - [ ] Nebo oboje (formulář generuje prompt pro Clauda)?
  - [ ] Minimální povinná pole pro spuštění tvorby

### Blok C: Review proces (jak manažer schvaluje)

- [ ] **Review checklist** — co přesně manažer kontroluje (formalizovat)
- [ ] **Review mechanismus** — kde se review dělá:
  - [ ] Přímo v Git? Pull request?
  - [ ] V Mozkotronu? (nějaký draft/publish status?)
  - [ ] Verbálně s Claudem v session?
- [ ] **Eskalace** — co když manažer zamítne 2× za sebou

### Blok D: Zpětná vazba (jak čtenář reaguje)

- [ ] **Feedback mechanismus v Mozkotronu**:
  - [ ] 👍👎 na stránce — je to technicky implementované?
  - [ ] Komentáře — ano/ne? Moderované?
  - [ ] Report formulář — existuje?
- [ ] **Zpracování feedbacku** — kdo vyhodnocuje, jak se to vrací jako trigger

### Blok E: Dashboard a analytika

- [ ] **Tracking čtení** — je implementovaný v Mozkotronu?
- [ ] **Dashboard pro manažera** — existuje? Co zobrazuje?
- [ ] **Stáří dokumentů** — jak se počítá, kde se zobrazuje
- [ ] **Priority tvorby** — jak se určuje, co dokumentovat příště

### Blok F: Technické propojení

- [ ] **Aktualizace frontmatter ve 14 přesunutých souborech** — doplnit audience, source_bimg
- [ ] **Smazat 3 staré law-* složky** — Jan ručně (rm nefunguje na _category_.json)
- [ ] **Aktualizovat Jak_pracovat_s_Claude.md** — sekce 7 odkazuje starý law-{tema} formát

---

## 📋 Doporučené pořadí práce

| # | Co | Proč teď | Kdo |
|---|-----|----------|-----|
| 1 | Finalizovat frontmatter kontrakt | Bez toho nemůžeme validně tvořit dokumenty | Jan + Claude |
| 2 | Vytvořit šablony pro každý typ | Bez šablony Claude neví přesně jak formátovat | Claude → Jan review |
| 3 | Registr existujících BIMG | Bez toho nefunguje rozhodovací strom | Claude |
| 4 | Intake proces | Definuje, jak se práce spouští | Jan rozhodne |
| 5 | Review proces | Definuje, jak se práce schvaluje | Jan rozhodne |
| 6 | Opravit 14 existujících souborů | Frontmatter musí odpovídat kontraktu | Claude |
| 7 | Feedback mechanismus | Závisí na tech stavu Mozkotronu | Jan + MOZKOTRON projekt |
| 8 | Dashboard | Závisí na tech stavu Mozkotronu | Jan + MOZKOTRON projekt |

---

*Claude aktualizuje tento soubor průběžně. Nemazat ručně — ale klidně připsat poznámky.*
