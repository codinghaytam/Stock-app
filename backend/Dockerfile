# Multi-stage Dockerfile for OlivePro backend (Spring Boot, Maven, Java 21)
# Stage 1: build with Maven
FROM maven:3.9.11 AS builder

WORKDIR /workspace/app

# Copy only maven metadata first to leverage Docker cache for deps
COPY pom.xml .
COPY mvnw .

# Copy source
COPY src ./src

# Build the fat jar (skip tests by default inside container build)
RUN mvn clean package -DskipTests -B -V -DoutputDirectory=/workspace/app/target

# Stage 2: runtime image
FROM eclipse-temurin:21-jre-jammy

LABEL org.opencontainers.image.description="OlivePro backend"
LABEL org.opencontainers.image.version="0.0.1"

# Create non-root user
RUN useradd --create-home --shell /bin/false appuser
WORKDIR /home/appuser

# Copy jar from builder
COPY --from=builder /workspace/app/target/*.jar /home/appuser/app.jar
RUN chown appuser:appuser /home/appuser/app.jar
USER appuser

EXPOSE 8080

# Recommended env vars (override at runtime)
ENV SPRING_DATASOURCE_URL="jdbc:postgresql://ep-little-leaf-ad3ej5bo-pooler.c-2.us-east-1.aws.neon.tech/neondb?user=neondb_owner&password=npg_wpGYxiXI8qn4&sslmode=require&channelBinding=require"
ENV SPRING_DATASOURCE_USERNAME="neondb_owner"
ENV SPRING_DATASOURCE_PASSWORD="npg_wpGYxiXI8qn4"
ENV SPRING_JPA_HIBERNATE_DDL_AUTO="update"
ENV APP_JWT_SECRET="XsQklMNNq9QNv2NlB9ZpzYXFxZizJQF3cAA7edZv8pB"
ENV APP_JWT_EXPIRATION_MS="86400000"
ENV APP_CORS_ALLOWED_ORIGIN=*

# JVM tuning (easy override)
ENV JAVA_OPTS="-Xms256m -Xmx512m -XX:+UseG1GC"

ENTRYPOINT ["sh","-c","java $JAVA_OPTS -jar /home/appuser/app.jar"]

# Optional healthcheck (requires actuator endpoint enabled in Spring Boot)
# HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD curl -f http://localhost:8080/actuator/health || exit 1

