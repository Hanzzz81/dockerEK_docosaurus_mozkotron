---
title: "🟢 AOR disky"
sidebar_label: "AOR disky"
sidebar_position: 2
description: "7 AOR disků — pracovní prostor skupin, root struktura, AOR0-COMMON"
category: law
layer: bimg
audience: [technologie]
version: "1.0"
author: Jan Kutílek
date: 2026-04-13
---

# 🟢 AOR disky — detail

**Režim:** Synology Drive, sdílené po AOR skupinách. „Pracuju s tím."

---

## Seznam disků (7 kusů)

| # | Disk | Skupina |
|---|------|---------|
| 0 | AOR0-COMMON | Všichni (AOR skupina 0) |
| 1 | AOR1-MANAGEMENT | Management |
| 2 | AOR2-FINANCE | Finance |
| 3 | AOR3-RUST | Růst a marketing |
| 4 | AOR4-NAKUP | Nákup |
| 5 | AOR5-PRODEJ | Prodej a služby |
| 6 | AOR6-TECHNOLOGIE | Technologie |

---

## Root struktura — shodná pro AOR1 až AOR6

```
AORx-NÁZEV/
├── 01_provoz/              ← WRK rutina (operativa, údržba)
│   ├── Aktivní/            ← 🔥 teď se na tom pracuje
│   ├── Uzavřené/           ← ☀️ hotovo, ještě čerstvé
│   └── Archiv/             ← ❄️ staré, ale musí existovat
│
├── 02_rozvoj/              ← WRK projekty (mění systém)
│   ├── Aktivní/
│   ├── Uzavřené/
│   └── Archiv/
│
├── 03_analyzy/             ← ANA (reporty, KPI, Excely)
│   ├── 2025/
│   ├── 2026/
│   └── Ad-hoc/
│
└── 04_zaznamy/             ← REC (neměnné formální dokumenty)
    ├── Smlouvy/
    ├── Protokoly/
    ├── Certifikaty/
    └── Ostatni/
```

---

## Co kam patří

**01_provoz** — rutina, operativa, běžná agenda. Nabídky, reklamace, objednávky, korespondence. Má začátek i konec, ale opakuje se.

**02_rozvoj** — projekty, změny systému. Rekonstrukce, zavedení nového procesu, remake starého. Jednorázové, mění firmu.

**03_analyzy** — reporty a přehledy. Vytaženo na root kvůli viditelnosti a váze, i když by AOR6-TECHNOLOGIE měl tuto složku poloprázdnou.

**04_zaznamy** — neměnné dokumenty (REC). Podepsané smlouvy, protokoly, certifikáty. Nesmí se měnit, nepromazávají se — prostě tam jsou.

---

## Teplotní model uvnitř složek

Ve složkách `01_provoz` a `02_rozvoj` je teplota rozlišena podsložkami:

- **Aktivní** 🔥 — teď se na tom pracuje
- **Uzavřené** ☀️ — hotovo, ale ještě čerstvé, často se do toho kouká
- **Archiv** ❄️ — staré, musí existovat, ale nikdo se do toho nedívá

Archiv se nikdy nemaže automaticky — data umírají jen vědomým rozhodnutím.

---

## AOR0-COMMON — speciální případ

Struktura flat podle účelu (ne shodná s AOR1-6), protože je to spíš „sdílený odkladní disk pro všechny":

```
AOR0-COMMON/
├── Nouzove-postupy/     ← co dělat při výpadku, offline formuláře
├── Sablony/             ← sdílené tiskové šablony
├── System/              ← wallpapery, ikony, connection stringy
└── Ostatni/             ← ostatní sdílené drobnosti
```

**Charakter:** nedůvěrné, nahraditelné, pro všechny. Drive sync, aby to bylo dostupné i offline.

**Proč AOR a ne USE:** AOR disky jsou sdílené po skupinách — AOR0 je skupina „všichni", takže logicky sedí. USE disky jsou per uživatel.

---

*Nadřazená stránka: [🗄️ Disková architektura](./diskova-architektura)*
