# Build from the repository root:
#   docker build -f executive-inputs-server/Dockerfile .
# Render and other hosts set PORT; gunicorn binds to 0.0.0.0:$PORT

FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app/executive-inputs-server

COPY executive-inputs-server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY executive-inputs-server/ /app/executive-inputs-server/
COPY docs/ /app/docs/
COPY deliverable/ /app/deliverable/

EXPOSE 10000
ENV PORT=10000

CMD exec gunicorn --bind 0.0.0.0:"${PORT}" --timeout 120 --workers 1 --threads 4 "app:app"
