FROM python:3.6-slim

WORKDIR /app
ADD ./server/requirements.txt /app/backend/

RUN pip install --upgrade pip
RUN pip install gunicorn
RUN pip install -r backend/requirements.txt

ADD ./docker /app/docker
ADD ./server /app/backend