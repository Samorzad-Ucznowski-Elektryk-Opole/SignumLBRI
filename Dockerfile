FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx tsc src/app.ts --outDir dist --target es2020 --module commonjs --strict false --skipLibCheck --esModuleInterop --allowSyntheticDefaultImports

EXPOSE 4000

CMD ["node", "start-server.js"]
