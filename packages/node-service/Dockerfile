FROM node:18-bullseye-slim
 
# curl is required for healthcheck
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

ARG PORT=1234

COPY . /app
WORKDIR /app/

RUN npm install

ENV PORT=$PORT

ENTRYPOINT ["npm", "start"]