FROM postgres:16-alpine

RUN apk add --no-cache bash

COPY infrastructure/db-backup/scripts /scripts
RUN find /scripts -type f -name '*.sh' -exec chmod +x {} +

ENV BACKUP_DIR=/backups \
    BACKUP_UID=1001 \
    BACKUP_GID=1001

WORKDIR /scripts
ENTRYPOINT ["/bin/bash", "/scripts/backup-loop.sh"]
