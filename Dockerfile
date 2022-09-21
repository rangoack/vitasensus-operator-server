FROM node:14-alpine
# Adding build tools to make yarn install work on Apple silicon / arm64 machines
RUN apk add python3 g++ make curl file
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --production
COPY node-config /gvite
ARG GVITE_VERSION=v2.11.3-nightly-202207201142
ARG GVITE_PLATFORM=darwin
COPY setup-server.sh ./
RUN chmod +x setup-server.sh
RUN ./setup-server.sh
RUN chmod +x /gvite/gvite
COPY . .
CMD [ "yarn", "run", "dev" ]
