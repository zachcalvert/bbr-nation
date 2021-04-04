# build environment
FROM node:13.12.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL http://165.232.130.109:8000/api
ARG REACT_APP_ADMIN_URL
ENV REACT_APP_ADMIN_URL http://165.232.130.109:8000/admin/
COPY package.json ./
COPY package-lock.json ./
RUN npm ci
RUN npm install react-scripts@3.4.1 -g
COPY . ./

RUN npm run build

# production environment
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
