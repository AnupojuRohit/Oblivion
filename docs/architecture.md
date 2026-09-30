# Architecture

LearnHub uses a modular monolith: one Next.js App Router application with domain modules under `src/modules`, shared infrastructure under `src/infrastructure`, and cross-cutting helpers under `src/lib`.

Route handlers stay thin: authenticate, validate, invoke a service, and return the standard `{ success, data }` or `{ success, error }` envelope. Server Components call services directly rather than making internal HTTP requests.

MongoDB is the only source of truth. Redis may later provide non-critical caching and rate limiting. External video is embedded; the app never hosts course video.

We deliberately avoid PostgreSQL/Supabase (no relational requirement), microservices/Kafka/RabbitMQ (unnecessary operational complexity), Kubernetes/Docker/VPS (managed Next.js hosting fits the deployment target), GraphQL (the specified REST APIs are sufficient), and Elasticsearch (MongoDB text indexes cover the initial catalogue search).
