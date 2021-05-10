FROM python:3.6-slim

WORKDIR /app
ADD ./server/requirements.txt /app/backend/

RUN pip install --upgrade pip
RUN pip install gunicorn
RUN pip install -r backend/requirements.txt
RUN python3 -m spacy download en_core_web_sm

ADD ./docker /app/docker
ADD ./server /app/backend