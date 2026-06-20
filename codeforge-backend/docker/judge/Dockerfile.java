FROM eclipse-temurin:21-jdk-alpine
RUN apk add --no-cache bash
WORKDIR /sandbox
COPY run.sh /run.sh
RUN chmod +x /run.sh
ENTRYPOINT ["bash", "/run.sh"]
