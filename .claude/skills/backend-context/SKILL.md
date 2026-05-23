---
name: backend-context
description: Use this skill for ANY task involving the Spring Boot backend — creating or editing entities, services, controllers, repositories, DTOs, exceptions, or adding a new module. Triggers on: backend, Spring, Java, API, endpoint, service, entidade, repositório, controller, DTO, migration, data.sql, H2, JPA, ou qualquer menção a código Java.
version: 1.0.0
---

# Backend Context — mylife-backend

Diretório raiz: `mylife-backend/mylife-backend/`  
Pacote base: `com.mylife`

---

## Stack

Spring Boot 3.5 · Java 21 · Maven · H2 (file) · Spring Data JPA · Spring Security · JWT (JJWT) · Lombok · SpringDoc OpenAPI 2

---

## Estrutura de pacotes

```
com.mylife
├── core/                          ← infraestrutura compartilhada (todos os módulos)
│   ├── config/                    ← OpenApiConfig
│   ├── controller/                ← AuthController, FamilyGroupController
│   ├── domain/entity/             ← User, FamilyGroup
│   ├── domain/enums/              ← Role, ProductType
│   ├── dto/request/               ← LoginRequest, RegisterRequest, ...
│   ├── dto/response/              ← ApiResponse<T>, AuthResponse, ...
│   ├── exception/                 ← BusinessException, GlobalExceptionHandler
│   ├── repository/                ← UserRepository, FamilyGroupRepository
│   ├── security/                  ← JwtService, JwtFilter, SecurityConfig, CorsProperties
│   └── service/                   ← AuthService, FamilyGroupService
│
├── finance/                       ← módulo myFinance
│   ├── controller/                ← TransactionController, AccountController, ...
│   ├── domain/
│   │   ├── converter/             ← YearMonthConverter (JPA AttributeConverter)
│   │   ├── entity/                ← Transaction, Account, CreditCard, Savings, ...
│   │   └── enums/                 ← TransactionType, AccountType, ...
│   ├── dto/
│   │   ├── request/               ← TransactionRequest, AccountRequest, ...
│   │   └── response/              ← TransactionResponse, AccountResponse, report/...
│   ├── repository/                ← TransactionRepository, AccountRepository, ...
│   └── service/                   ← TransactionService, AccountService, ...
│
└── fit/                           ← módulo myFit (a criar — seguir mesmo padrão de finance/)
```

**Regra:** cada novo módulo (`fit/`, `nutrition/`, etc.) cria seu próprio subpacote seguindo o mesmo padrão de `finance/`.

---

## Padrão de resposta — ApiResponse\<T\>

```java
// Sucesso
return ResponseEntity.status(HttpStatus.CREATED)
    .body(ApiResponse.success(resultado, "Mensagem de sucesso."));

// Sem body (delete)
return ResponseEntity.noContent().build();
```

`ApiResponse<T>` tem campos: `data`, `message`, `status` (`"SUCCESS"` | `"ERROR"` | `"VALIDATION_ERROR"`).  
O frontend acessa a mensagem via `response.data.message`.

---

## Exceções de negócio — BusinessException

```java
// Lança com HTTP status apropriado
throw new BusinessException("Mensagem clara para o usuário.", HttpStatus.BAD_REQUEST);
throw new BusinessException("Recurso não encontrado.", HttpStatus.NOT_FOUND);
throw new BusinessException("Operação não permitida.", HttpStatus.UNPROCESSABLE_ENTITY);
```

`GlobalExceptionHandler` captura automaticamente e retorna `ApiResponse.error(message)` com o status configurado. **Nunca usar `RuntimeException` genérica** para erros de negócio.

---

## Segurança — usuário autenticado no Service

```java
@Service
@RequiredArgsConstructor
public class XxxService {
    private final UserRepository userRepository;

    // SEMPRE recarregar o User do banco — o @AuthenticationPrincipal pode estar desatualizado
    private User reloadUser(User authenticatedUser) {
        return userRepository.findById(authenticatedUser.getId())
            .orElseThrow(() -> new BusinessException("Usuário não encontrado.", HttpStatus.NOT_FOUND));
    }

    // OWNER vê tudo do grupo; MEMBER vê apenas o próprio
    private FamilyGroup requireFamilyGroup(User owner) {
        if (owner.getFamilyGroup() == null)
            throw new BusinessException("Usuário não possui grupo familiar.", HttpStatus.UNPROCESSABLE_ENTITY);
        return owner.getFamilyGroup();
    }
}
```

No Controller: `@AuthenticationPrincipal User user` — Spring injeta o usuário logado automaticamente.

---

## Padrão de Controller

```java
@RestController
@RequestMapping("/api/v1/finance/xxx")
@RequiredArgsConstructor
@Tag(name = "Xxx", description = "Descrição do recurso")
@SecurityRequirement(name = "bearerAuth")
public class XxxController {

    private final XxxService xxxService;

    @PostMapping
    public ResponseEntity<ApiResponse<XxxResponse>> create(
            @Valid @RequestBody XxxRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(xxxService.create(request, user), "Criado com sucesso."));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<XxxResponse>>> findAll(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(xxxService.findAll(user), "Encontrados."));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<XxxResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody XxxRequest request,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(xxxService.update(id, request, user), "Atualizado."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal User user) {
        xxxService.delete(id, user);
        return ResponseEntity.noContent().build();
    }
}
```

---

## Padrão de Entity

```java
@Entity
@Table(name = "tb_xxx")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Xxx {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "family_group_id", nullable = false)
    private FamilyGroup familyGroup;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { this.createdAt = LocalDateTime.now(); }
}
```

---

## Banco de dados — H2 file + migrations manuais

**Arquivo:** `mylife-backend/data/mylifedb.mv.db` (ignorado pelo git).  
**`ddl-auto=update`** cria novas tabelas/colunas, mas **NÃO altera** nullability ou tipo de colunas existentes.

Para mudanças que o Hibernate não faz automaticamente, usar `data.sql`:

```sql
-- src/main/resources/data.sql
ALTER TABLE IF EXISTS tb_xxx ALTER COLUMN minha_coluna DROP NOT NULL;
ALTER TABLE IF EXISTS tb_xxx ADD COLUMN IF NOT EXISTS nova_coluna VARCHAR(255);
```

`application.properties` já tem configurado:
```properties
spring.sql.init.mode=always
spring.jpa.defer-datasource-initialization=true
```

---

## YearMonthConverter

Para campos `YearMonth` no JPA (armazenado como `VARCHAR` `YYYY-MM`):

```java
@Convert(converter = YearMonthConverter.class)
private YearMonth competencia;
```

O converter já existe em `com.mylife.finance.domain.converter.YearMonthConverter`.

---

## URLs úteis (dev)

| URL | Descrição |
|-----|-----------|
| `http://localhost:8080/swagger-ui.html` | Swagger UI — todos os endpoints |
| `http://localhost:8080/h2-console` | Console H2 — JDBC: `jdbc:h2:file:./data/mylifedb` |
| `http://localhost:8080/actuator/health` | Health check |
| `http://localhost:8080/v3/api-docs` | OpenAPI JSON |

---

## Como adicionar um novo módulo (ex: myFit)

1. Criar pacote `com.mylife.fit/` espelhando a estrutura de `finance/`
2. Criar entidades em `fit/domain/entity/` com `@Table(name = "tb_fit_xxx")`
3. Controllers com `@RequestMapping("/api/v1/fit/xxx")`
4. Liberar rotas novas no `SecurityConfig` se necessário (rotas `/api/v1/**` já estão autenticadas)
5. Frontend: criar hooks em `use-fit.ts` com query keys `['fit', 'xxx']`
