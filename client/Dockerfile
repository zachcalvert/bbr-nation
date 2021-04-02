# build environment
FROM node:13.12.0-alpine as build
WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL http://143.198.238.73:8000/api
ARG REACT_APP_ADMIN_URL
ENV REACT_APP_ADMIN_URL http://143.198.238.73:8000/admin/
COPY package.json ./
COPY package-lock.json ./
RUN npm ci
RUN npm install react-scripts@3.4.1 -g
COPY . ./

RUN npm run build


# production environment
FROM nginx:1.16.0-alpine
COPY --from=builder /app/build /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d
EXPOSE 5000
CMD ["nginx", "-g", "daemon off;"]