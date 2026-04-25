# Postup nastavení přímého kanálu

1. stažení aplikace PK
2. získání certifikátu v souboru
3. nastavení aplikace na stanici
4. klon aplikace do druhé instance pro stahování PK

### Instance 1

- stahuje GPC
- stahuje PDF k výpisu
- stahuje PKO výpisy

### Instance 2

- stahuje PDF PK

<aside>
ℹ️

- appka se musí pouštět s parametrem, aby používala certifikát C:\Program Files (x86)\Primy kanal\pkkb.exe" /action=admin /mode=cert
- pro akci se musí zavolat parametr
    - /action=get /mode=cert /fc=1
    - /action=getstatement /mode=cert /fc=1
    - /action=getpk /mode=cert /fc=1
</aside>

# Instance 1

- pracuje z cesty C:\Program Files (x86)\Primy kanal

<aside>
📄

cesta k certifikátu

![2024-11-14_15-30-20.png](Postup%20nastaven%C3%AD%20p%C5%99%C3%ADm%C3%A9ho%20kan%C3%A1lu/2024-11-14_15-30-20.png)

</aside>

<aside>
⏬

stahování PDF od PK

![2024-11-14_15-28-27.png](Postup%20nastaven%C3%AD%20p%C5%99%C3%ADm%C3%A9ho%20kan%C3%A1lu/2024-11-14_15-28-27.png)

</aside>

<aside>
⏬

stahování PDF od výpisů

![2024-11-14_15-30-03.png](Postup%20nastaven%C3%AD%20p%C5%99%C3%ADm%C3%A9ho%20kan%C3%A1lu/2024-11-14_15-30-03.png)

</aside>

<aside>
⏬

stahování PK ve formátu PKO (PDF se musí udělat v nové instanci)

![2024-11-14_15-29-00.png](Postup%20nastaven%C3%AD%20p%C5%99%C3%ADm%C3%A9ho%20kan%C3%A1lu/2024-11-14_15-29-00.png)

</aside>

# Instance 2 - jen na PDF od PK

- pracuje z cesty C:\Program Files (x86)\Primy kanal PD PDF
    
    <aside>
    ⏬
    
    stahování PK ve formátu PDF (PDF se musí udělat v nové instanci)
    
    ![2024-11-14_15-38-43.png](Postup%20nastaven%C3%AD%20p%C5%99%C3%ADm%C3%A9ho%20kan%C3%A1lu/2024-11-14_15-38-43.png)
    
    </aside>