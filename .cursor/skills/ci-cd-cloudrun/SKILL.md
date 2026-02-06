---
description: "Configuración de CI/CD con GitHub Actions para despliegue en Google Cloud Run. Usar cuando se modifiquen pipelines, Dockerfile, o configuración de despliegue."
---

# Skill: CI/CD GitHub Actions → Cloud Run

## Cuándo Usar
- Modificar Dockerfile o docker-compose
- Configurar o debuggear GitHub Actions
- Gestionar secretos y variables de entorno
- Configurar Cloud Run (instancias, memoria, CPU)

## Pipelines
| Workflow | Trigger | Destino |
|----------|---------|---------|
| ci.yml | Pull Request | Solo validación |
| deploy-staging.yml | Push develop | Cloud Run staging |
| deploy-production.yml | Push main | Cloud Run production |

## Dockerfile Best Practices
- Multi-stage: deps → builder → runner
- Puerto: 8080 (obligatorio Cloud Run)
- User: nextjs (no root)
- Output: standalone
- .dockerignore: node_modules, .git, .next, .env*

## Secretos Necesarios
- GCP_SA_KEY: Service Account JSON
- Variables de entorno en Cloud Run Secret Manager
