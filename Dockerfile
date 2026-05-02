FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY backend backend
COPY dashboard dashboard
COPY public-site public-site
COPY assets assets
RUN mvn -f backend/pom.xml -DskipTests package
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/backend/target/khorasan-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
