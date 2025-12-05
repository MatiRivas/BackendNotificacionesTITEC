Microservicio de Notificaciones – Grupo 8
Dockerizado para Integración – Frontend + Backend + MongoDB + Kafka + Zookeeper + Nginx

Este repositorio contiene el microservicio de Notificaciones (Grupo 8) totalmente dockerizado y configurado según el mapa oficial de puertos del proyecto integrador.

Este README explica:

Estructura del proyecto

Puertos asignados

Configuración del backend, frontend y Nginx

Cómo levantar todo el sistema en cualquier computador

notificaciones-microservicio
 ├── backend/
 │     ├── Dockerfile
 │     ├── src/
 │     ├── package.json
 │     └── ...
 ├── frontend/
 │     ├── Dockerfile
 │     ├── src/
 │     ├── package.json
 │     └── ...
 ├── nginx/
 │     └── nginx.conf
 ├── docker-compose.yml
 └── README.md


Puertos oficiales del Grupo 8

Según el mapa de puertos del proyecto:

Servicio	                 Puerto Host
Backend (Nest.js)	         4500
Frontend (servido por Nginx)	 4508
Kafka	                         4506
Zookeeper	                 4507
MongoDB	                         5173


Cómo levantar el proyecto

En la raíz del proyecto, ejecutar:

docker compose up --build


Esto iniciará:

Frontend compilado → servido por Nginx

Backend Nest.js

MongoDB

Kafka

Zookeeper

Nginx como gateway



Acceder al microservicio
Servicio	           URL
Frontend	           http://localhost:4508
Backend API                http://localhost:4500/api
MongoDB	                   localhost:5173
Kafka Broker	           localhost:4506
Zookeeper	           localhost:4507

Comandos útiles
Para reconstruir todo:
docker compose up --build --force-recreate

Para detener contenedores:
docker compose down

Para ver logs:
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f kafka
