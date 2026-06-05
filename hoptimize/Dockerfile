FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /opt/hoptimize

RUN useradd --system --home-dir /var/lib/hoptimize --shell /usr/sbin/nologin hoptimize \
    && mkdir -p /var/lib/hoptimize /var/log/hoptimize \
    && chown -R hoptimize:hoptimize /var/lib/hoptimize /var/log/hoptimize

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

USER hoptimize
EXPOSE 8090

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8090"]
