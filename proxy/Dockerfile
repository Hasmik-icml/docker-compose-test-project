FROM node:16.16.0

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm i

COPY . .

CMD ["bash", "-c", "npm run start"] 
