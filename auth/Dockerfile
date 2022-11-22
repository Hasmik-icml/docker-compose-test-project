FROM node:16.16.0

WORKDIR /auth

COPY package.json package-lock.json ./

RUN npm i

COPY prisma ./
RUN npx prisma generate

COPY . .

CMD ["bash", "-c", "npm run migrate && npm run start "] 
# CMD ["npx", "prisma", "migrate", "reset", "-f"]
# CMD ["npm", "run", "start", "build"]
