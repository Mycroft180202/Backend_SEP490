FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

ARG REACT_APP_API_BASE_URL="https://hoalachandicraft-fmbmfmfcehdyeqgz.eastasia-01.azurewebsites.net/"
ARG REACT_APP_API_TIMEOUT="30000"

ENV REACT_APP_API_BASE_URL=${REACT_APP_API_BASE_URL}
ENV REACT_APP_API_TIMEOUT=${REACT_APP_API_TIMEOUT}

RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
