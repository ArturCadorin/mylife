---
name: start-servers
description: Use this skill when the user wants to start, run, or launch the development servers — backend, frontend, or both. Triggers on phrases like "inicia os servidores", "subir o backend", "rodar o frontend", "start servers", "iniciar o projeto", "subir tudo", "rodar local", "start dev", "iniciar servidor", or any variation of starting/running the mylife application locally.
version: 1.0.0
---

# Start Servers — mylife-backend + mylife-web

Skill para iniciar o ambiente de desenvolvimento local do projeto MyLife.

## Visão Geral

| Serviço | Tecnologia | Porta | Diretório |
|---------|-----------|-------|-----------|
| Backend | Spring Boot 3.5 (Java 21, Maven) | 8080 | `mylife-backend/mylife-backend/` |
| Frontend | Next.js 16 (React 19, TypeScript) | 3000 | `mylife-web/` |

---

## Iniciar o Backend (Spring Boot)

Use `run_in_background: true` para não bloquear a conversa.

```powershell
# A partir do diretório raiz do projeto
cd "mylife-backend/mylife-backend"
./mvnw.cmd spring-boot:run
```

**Verificar se subiu** — aguarde ~20 segundos e procure no output:
```
Started MylifeBackendApplication in X seconds
```
ou
```
Tomcat started on port 8080
```

**Smoke test:**
```powershell
Invoke-WebRequest http://localhost:8080/actuator/health -UseBasicParsing
# Esperado: StatusCode 200
```

---

## Iniciar o Frontend (Next.js)

```powershell
# A partir do diretório raiz do projeto
cd "mylife-web"
npm run dev
```

**Verificar se subiu** — procure no output:
```
▲ Next.js 16.x.x
- Local: http://localhost:3000
```

---

## Iniciar Ambos em Paralelo

Inicie os dois com `run_in_background: true` em chamadas paralelas de Bash:

1. Backend: `cd "mylife-backend/mylife-backend" && ./mvnw.cmd spring-boot:run`
2. Frontend: `cd "mylife-web" && npm run dev`

Aguarde ~20 segundos e então verifique as duas portas.

---

## URLs Úteis

| URL | Descrição |
|-----|-----------|
| `http://localhost:3000` | Frontend Next.js |
| `http://localhost:8080` | API REST |
| `http://localhost:8080/swagger-ui.html` | Swagger UI |
| `http://localhost:8080/v3/api-docs` | OpenAPI JSON |
| `http://localhost:8080/h2-console` | Console H2 (banco em memória) |
| `http://localhost:8080/actuator/health` | Health check |

**H2 Console:**
- JDBC URL: `jdbc:h2:mem:mylifedb`
- Usuário: `sa` / Senha: *(vazio)*

---

## Pré-requisitos

- Java 21+ no PATH (`java -version`)
- Node.js + npm no PATH (`node -v`, `npm -v`)
- O wrapper `mvnw.cmd` já está no repo — não precisa de Maven instalado globalmente

---

## Notas Importantes

- O banco H2 é **em memória** — dados são perdidos a cada restart do backend
- CORS configurado para `http://localhost:3000` e `http://localhost:4200`
- O backend usa JWT; configure `mylife.security.jwt.secret` em `application.properties` se necessário
- DevTools ativo no backend: LiveReload na porta 35729
