# Skill: run-backend

description: Inicia o servidor Spring Boot do mylife-backend localmente em background e verifica se subiu corretamente.

## Como rodar

O projeto usa **Maven** como build tool. O comando principal é:

```powershell
mvn spring-boot:run
```

Execute a partir da raiz do projeto (`mylife-backend/`), onde está o `pom.xml`.

### Iniciar em background (recomendado via Claude Code)

```bash
mvn spring-boot:run
```

Use `run_in_background: true` na ferramenta Bash para não bloquear a conversa. O output vai para um arquivo temporário que pode ser lido com a ferramenta Read.

### Verificar se o servidor subiu

Aguarde ~15 segundos e procure no output pela linha:

```
Tomcat started on port 8080 (http) with context path '/'
```

ou

```
Started MylifeBackendApplication in X seconds
```

### Smoke test

```bash
curl http://localhost:8080/actuator/health
# ou, se actuator não estiver disponível:
curl -o /dev/null -s -w "%{http_code}" http://localhost:8080/v3/api-docs
```

Esperado: status HTTP 200.

## Endpoints úteis após subir

| URL | Descrição |
|-----|-----------|
| `http://localhost:8080` | Raiz da API |
| `http://localhost:8080/swagger-ui.html` | Swagger UI |
| `http://localhost:8080/v3/api-docs` | OpenAPI JSON |
| `http://localhost:8080/h2-console` | Console web do banco H2 |

### Credenciais do H2 Console

- **JDBC URL:** `jdbc:h2:mem:mylifedb`
- **User:** `sa`
- **Password:** *(vazio)*

## Configurações relevantes

- Porta: **8080** (definida em `src/main/resources/application.properties`)
- Banco: **H2 em memória** — os dados são resetados a cada restart (`ddl-auto=create-drop`)
- CORS liberado para: `http://localhost:4200` e `http://localhost:3000`
- JWT secret configurável em `mylife.security.jwt.secret`
- DevTools ativo: LiveReload na porta **35729**

## Pré-requisitos

- Java 21+ no PATH (`java -version`)
- Maven 3.x no PATH (`mvn -version`) — ou usar o wrapper `./mvnw` se disponível
