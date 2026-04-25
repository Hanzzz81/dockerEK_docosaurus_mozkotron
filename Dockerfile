FROM node:22-alpine

# better-sqlite3 potřebuje build tools pro kompilaci nativního modulu
RUN apk add --no-cache python3 build-base

WORKDIR /app

# Zkopíruj package.json a nainstaluj závislosti (Docusaurus + server)
COPY package.json ./
RUN npm install

# Patch: Docusaurus 3.10.0 předává webpacku parametry (name, color,
# reporters, reporter) které nové webpack schéma odmítá.
# Povolíme additionalProperties ve validačním schématu.
RUN sed -i 's/"additionalProperties": false/"additionalProperties": true/' \
    node_modules/webpack/schemas/plugins/ProgressPlugin.json

# Zkopíruj zdrojové soubory
COPY . .

# Start: Express server spustí Docusaurus dev server přes docs-watcher.js
# Docusaurus na portu 3001 (interní, spravovaný watcherem), Express na portu 3000 (veřejný)
EXPOSE 3000

CMD ["node", "server.js"]
