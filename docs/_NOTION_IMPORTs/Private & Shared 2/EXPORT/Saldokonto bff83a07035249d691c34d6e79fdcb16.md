# Saldokonto

<aside>
✌️

# **131/100 párování mezi DLP a FP**

**Požadovaný stav:**

- visí pouze DLP co jsou z aktuálních 1-2 týdnů a čeká se na FP1
- visí zde DLPR ke kterým ještě nedorazil DBP (nemělo by trvat déle než 2 měsíce), pak urgovat
- visí zde DLPV ke kterým ještě nedorazil DBP (nemělo by trvat déle než 2 měsíce), pak urgovat

**Strany:**

- DLP nebo DLPR nebo DLPV
- FP1 a FP3

**Typické chyby:**

- na DLPx chybí VS
- chyba ve VS, jedno je VS dodáku a druhé je VS faktury
- někde něco visí a má se fakturovat, je třeba zaurgovat dodavatele

**Frekvence**:

- týdenní kontrola
</aside>

<aside>
✌️

# **395/000 párování pokladních uzávěrek**

**Požadovaný stav:**

- mělo by být nulové **v souhrnu**
- nerozlišujeme na IČ

**Strany:**

- ID generovaný z uzávěrky
- PD, PHDK na to navázaný

**Typické chyby:**

- nemělo by se stávat, pokud není chyba v UZ

![](https://t4612515.p.clickup-attachments.com/t4612515/00301473-9f2d-48b9-b298-11deb3340281/image.png)

</aside>

<aside>
✌️

# **395/211 druhotná kontrola nenapárovaných úhrad v POKLADNĚ**

**Požadovaný stav:**

- mělo být prázdné
- zůstávají pouze položky, ke kterým čekáme na FA

**Strany:**

- Nemá strany, jsou zde dočasně jen položky (pokladní doklady) s kontací "**NESP" které po změně na úhrady zmizí**
- visí zde především dobírky, kde ještě nejsou rozpadlé faktury na jednotlivé předpisy

**Typické chyby:**

- úhrady, ke které nemáme FA
- dvakrát placené FA

![](https://t4612515.p.clickup-attachments.com/t4612515/de32f597-c473-4849-8a5e-bba064ef3b39/image.png)

</aside>

<aside>
✌️

# **395/221 druhotná kontrola nenapárovaných úhrad v BANCE**

**Požadovaný stav:**

- mělo být prázdné
- zůstávají pouze položky, ke kterým čekáme na FA

**Strany:**

- Nemá strany, jsou zde dočasně jen položky (pokladní doklady) s kontací "**NESP" které po změně na úhrady zmizí**
- visí zde předem placené zboží
- platby kartou

**Typické chyby:**

- úhrady, ke které nemáme FA
- dvakrát placené FA

![](https://t4612515.p.clickup-attachments.com/t4612515/e0bc0ea8-c144-46b3-97ce-6f23911e79a5/image.png)

</aside>

<aside>
✌️

# **395/315 párování PK mezi ID a PHDK**

**Požadovaný stav:**

- měl by být denně nulový

**Strany:**

- interní doklad co hradí FV
- Pohledávkový doklad, co se páruje na banku

**Typické chyby:**

- druhý doklad chybí úplně
    - ideální je smazat ID a provést platbu FV znovu
- chyba u partnera (nezmění se na partnera na FV)
    - stačí opravit
</aside>

<aside>
✌️

# **395/800 párování přeplatků a vratek**

**Požadovaný stav:**

- mělo by být nulové
- zůstatek znamená nevyrovnaný přeplatek nám nebo druhé straně

**Strany:**

- bankovní položka 1
- bankovní položka 2

**Typické chyby:**

- není stejný partmner s IČ
- není stejný VS
- nebylo požádáno o vrácení nebo jsme nevrátli my
</aside>

<aside>
✌️

# **315/100 párování PK mezi PHDK a BV**

**Požadovaný stav:**

- nebude nikdy nulový
- ale nechceme tam různá IČ a vše by mělo viset jen z posledních 3-4 dnů

**Strany:**

- PHDK s partnerem
- položky PKO výpisů

**Typický postup:**

- páruje se jako úhrada z banky, tady je to pouze kontrola že na sebe kromě úhrady sedl i parner

**Typické chyby:**

- nesedí partner

![](https://t4612515.p.clickup-attachments.com/t4612515/aac5e2e1-5299-4735-9929-b16765bd577b/image.png)

</aside>

<aside>
✌️

# 315/111 párování převodů čistých částek z PKO na BV

**Požadovaný stav:**

- měly by viset pouze poslední 3-4 výpisy
- kromě pondělí, kdy sedí vše do nuly

**Strany:**

- PKO poslední převodová položka
- Příjmová položka na BV

**Typické chyby:**

- nesedí VS (zůstal původní 82223474)
</aside>

<aside>
✌️

# **261/100 párování odvodů tržeb do banky**

**Požadovaný stav:**

- měl by být po načtení banky denně nulový

**Strany:**

- pokladní doklady P0 výdajové
- položky bankovních výpisů - příjmové

**Typický postup:**

- na BV se opraví VS podle pokladny

**Typické chyby:**

- neshoda VS
- přesmyčka v částce
</aside>

<aside>
✌️

# **261/211 párování převodů mezi pokladnami.**

**Požadovaný stav:**

- měl by být denně nulový

**Strany:**

- pokladní doklady na pokladně jedné
- pokladní doklady na pokladně druhé

**Typický postup:**

- na příjmové dokladu se doplní VS podle výdajového

**Typické chyby:**

- neshoda VS
- přesmyčka v částce
</aside>

<aside>
✌️

# **261/221 párování převodů mezi bankami**

**Požadovaný stav:**

- měl by být denně nulový

**Strany:**

- bankovní doklady na jednom našem účtu
- bankovní doklady na druhém našem účtu

**Typický postup:**

- VS se přenáší sám, obvykle se jen kontroluje IČ

**Typické chyby:**

- nebyl natažený partner Elektro Kutílek s.r.o. s IČem
- chyba částky i VS je vyloučena
</aside>

[https://embed.figma.com/board/qNIx49vJTfp1YOZunGd39E/Schema-SALDOKONTA?node-id=0-1&t=7lwm3L80RnASrcKS-1&embed-host=notion&footer=false&theme=system](https://embed.figma.com/board/qNIx49vJTfp1YOZunGd39E/Schema-SALDOKONTA?node-id=0-1&t=7lwm3L80RnASrcKS-1&embed-host=notion&footer=false&theme=system)