# Bankovní výpisy

# **1.Stažení bankovních výpisů**

**1. Automatické stažení výpisů:**

- Všechny denní bankovní výpisy se stahuji z internetového bankovnictví automaticky na určený disk M:
- Každý den se generuje výpis na účet, pokud ten den proběhl pohyb. Pokud žádný pohyb není, výpis se negeneruje.
1. **Ověření stažených výpisů**
- Zkontrolujte, zda všechny potřebné výpisy (FIO 2002, FIO 5748, FIO EUR 2502, KB a PKO výpisy akceptantů) byly staženy do odpovídajících složek

# **2.Import výpisů do Money**

**1.Postup importu výpisů:**

- Otevřete program Money
- Pro každý bankovní účet najděte odpovídající složku (např. FIO 5748,…)
- Naimportujte bankovní výpisy postupně tak, aby byla zachována číselná řada.
- U stahování Platebních karet stahuju pomoci Import výpisu plateb, jinak je postup stejn

![CleanShot 2025-04-29 at 12.13.33.png](Bankovn%C3%AD%20v%C3%BDpisy/CleanShot_2025-04-29_at_12.13.33.png)

**Poznámka:** Pořadí výpisů je důležitě - výpisy musí být v Money za sebou podle data.

![image.png](Bankovn%C3%AD%20v%C3%BDpisy/image.png)

![](https://t4612515.p.clickup-attachments.com/t4612515/578be9d9-b26f-4803-ac47-265225b3ca4a/image.png)

**2.Kontrola importu**

- Ujistěte se, že všechny výpisy byly úspěšně naimportovány.

**3.Připojení PDF přílohy**

- otevřete Money a v příslušné složce pr. tlačítkem k danému výpisu připojte dokument (výpis).
- Typ souboru vyberu Bankovní výpis a v dokument vyberu místo uložení, kde výpis mám (M:\Výpisy)

![image.png](Bankovn%C3%AD%20v%C3%BDpisy/image%201.png)

![image.png](Bankovn%C3%AD%20v%C3%BDpisy/image%202.png)

# **3.Vypořádání položek výpisu**

- Postavím se na daný výpis stisknu políčko Párovat úhrady - Zavřít, jakmile proběhnout všechny položky - poté stisknu klávesu F5

![image.png](Bankovn%C3%AD%20v%C3%BDpisy/image%203.png)

![image.png](Bankovn%C3%AD%20v%C3%BDpisy/image%204.png)

**1.Kontrola nenapárovaných položek:**

- Po importu výpisu zkontrolujte, zda všechny položky byly správně spárovány.
    - Pokud nějaké položky zůstaly nenapárované, ručně je přiřaďte k odpovídajícím dokladům nebo pohybům.
    - Pokud není možné některou položku spárovat, zjistěte důvod a dořešte situaci

![image.png](Bankovn%C3%AD%20v%C3%BDpisy/image%205.png)

**2.Zajištění vypořádání výpisu:**

- Výpis je považován za **vypořádaný**, pokud nemá žádné nenapárované položky
- Pokud tomu tak je, přiřadím k výpisu příznak - Zelenou vlajku (pr.tlačítko myši nad sloupcem příznak)

# 4.Označení a přesun výpisu

**1.Označení zpracovaného výpisu:**

- Po vypořádání výpis označte známým tagem/příznakem Zelená vlajka jako Hotovo

![image.png](Bankovn%C3%AD%20v%C3%BDpisy/image%206.png)

**2.Přesun do podsložky**

- Přesuň vypořádaný výpis do složky “Archiv” pro daný účet.

# **5. Struktura složek v Money**

- Každý bankovní účet má svou složku. Struktura složky by měla vypadat takto:
    
    ![image.png](Bankovn%C3%AD%20v%C3%BDpisy/image%207.png)
    

# 6. Pravidelná kontrola

- **Průběžně kontrolujte:**
    - že ve složce nezůstávají **Nenapárované** výpisy déle, než je nezbytně nutné
    - že jsou výpisy v archivu kompletní a správně označené
    - číselná řada výpisů je nepřerušená
    - jsou u všech výpisů připojené přílohy

Tímto způsobem zajistíte, že všechny výpisy budou správně zpracovány, spárovány a uloženy do systému.

Pravidelné úhrady:

Vklad do bankomatu: Typ transakce: Vklad, Kontace: 261-BPTRŽ, v.s. - dohledat v.s. z pokladního dokladu - Odvody do banky a doplnit stejný

Když je přeplatek: Typ transakce: Převod, Kontace: 395 Přeplatek, v.s. - musí být stejný u obou úhrad (jednou vydaná úhrada a jednou přijatá)

KB Wordline: Typ transakce: Převod, Kontace: 315-PK, v.s. - doklad z Výpisu platebních karet na stejnou částku

Převod z KB do FIO: Typ transakce: Převod, Kontace: 261 Převod, vybrat plátce naše firma Elektro Kutílek, v.s. částka v tisících a DDMMRR příklad, převedeme 1.5.2025 500 000Kč, v.s. bude vypadat 500010525

Poplatky vůči bance: Typ transakce: Poplatek, Kontace: 568 Poplatek

Korekce čistých částek: Typ transakce: Převod, Kontace 315-PK, v.s. číslo výpisu, ve kterém tato úhrada je → toto je ve výpisu PK a totéž musím udělat i u výpisu KB