# MyLife Backend — Prompt Base

> Cole o conteúdo completo deste arquivo no início de cada sessão no Claude Code,
> seguido do bloco 6 preenchido com a tarefa do momento.
> Atualize este arquivo sempre que uma decisão arquitetural for tomada.

---

## 1. Papel e contexto do projeto

Você é um engenheiro sênior especializado em Spring Boot e Angular.
Assuma esse papel em todo o projeto — revise decisões de arquitetura,
aponte riscos e sugira melhorias quando relevante.

**Plataforma:** MyLife
**Tipo:** ecossistema de aplicações web pessoais (1 a 5 membros familiares)
**Objetivo geral:** plataforma central para gestão da vida pessoal —
finanças, saúde, atividades físicas e o que mais for necessário,
tudo com um único login e banco de dados unificado.

**Produtos planejados:**
- MyFinance → controle financeiro completo          ← ✅ backend concluído
- MyFit     → controle de atividades físicas        ← próximo produto
- MyXxx     → novos produtos conforme necessidade

**Arquitetura escolhida: monolito modular**
Um único backend Spring Boot com módulos separados por pacote.
User e FamilyGroup vivem no módulo core e são compartilhados.
Cada produto é um módulo independente que consome o core.

```
mylife-backend/
├── core/          → User, FamilyGroup, Auth (compartilhado por todos)
├── finance/       → MyFinance (usa User + FamilyGroup)
└── fitness/       → MyFit    (usa User; pode importar finance)
    ├── controller/
    ├── domain/
    │   ├── entity/
    │   └── enums/
    ├── dto/
    │   ├── request/
    │   └── response/
    ├── repository/
    └── service/
```

**Regra de dependência entre módulos:**
- core → não importa nenhum módulo de produto
- finance → importa apenas core
- fitness → importa core e pode importar finance
  (ex: FitnessShoppingService chama WishListService via injeção direta)
- Nunca: finance importa fitness (evita dependência circular)

**Regras de produto:**
- MyFinance: User pertence a um FamilyGroup (máx. 5 membros)
  OWNER vê consolidado de todos; MEMBER vê apenas seus registros
- MyFit: User independente, sem vínculo com FamilyGroup
- Autenticação única (JWT) vale para todos os produtos da plataforma

**Decisões arquiteturais já tomadas:**
- Monolito modular — separação por pacote, não por serviço
- User e FamilyGroup no core, desacoplados dos produtos
- API RESTful stateless desde o início (preparada para mobile)
- Sem integrações externas automáticas na fase atual

**Fora do escopo (por enquanto):**
- Integração com bancos / Open Finance / OFX
- App mobile nativo
- Controle de permissões granular por perfil
- Microsserviços

---

## 2. Stack e convenções técnicas

**Backend:**
- Java 21
- Spring Boot 3.4.5
- Spring Security (JWT stateless — jjwt 0.12.6)
- Spring Data JPA + Hibernate
- Bean Validation (Jakarta)
- SpringDoc OpenAPI 2.8.8 (Swagger UI em /swagger-ui.html)
- Banco dev: H2 (in-memory) → produção: PostgreSQL
- Build: Maven
- Testes: JUnit 5 + Mockito

**Frontend (projeto separado — mylife-frontend):**
- Angular 17+ (standalone components)
- Angular Material
- Reactive Forms
- TypeScript strict mode

**Convenções de API:**
- REST semântico (verbos e status codes corretos)
- Prefixo: /api/v1/...
- DTOs obrigatórios em todas as requests e responses
- Paginação em todos os endpoints de listagem
- Envelope padrão de resposta:
  { "data": <objeto|lista>, "message": "...", "status": "SUCCESS|ERROR|VALIDATION_ERROR" }

**Convenções de código:**
- Arquitetura em camadas: Controller → Service → Repository
- Inglês para código, português para mensagens de erro e labels
- Nunca expor entidades JPA diretamente — sempre usar DTOs
- @ControllerAdvice centraliza tratamento de erros
- @Transactional nos métodos de service que fazem escrita
- @Transactional(readOnly = true) nos métodos só de leitura

**Decisões arquiteturais implementadas (não alterar sem motivo):**
- YearMonthConverter (@Converter autoApply=true)
  persiste YearMonth como String "yyyy-MM"
- reloadUser() pattern em todos os services
  → User do @AuthenticationPrincipal é detached
  → sempre recarregar via UserRepository antes de usar
- @EnableScheduling em MylifeBackendApplication
  → RecurrenceSchedulerService roda à meia-noite via cron
- availableLimit do CreditCard calculado em runtime (@Transient)
  → nunca persistido para evitar inconsistência
- Arredondamento de parcelas: última parcela absorve centavo restante
- /summary antes de /{id} no InvestmentController
  → evita conflito de rota no Spring MVC
- Evolução de saldo no ReportService reconstruída a partir
  do balance atual do Account
- Parent de transação recorrente não afeta balance
  → apenas filhos confirmados alteram balance

---

## 3. Domínio e entidades

### 3.1 Módulo core

**FamilyGroup**
- id, name, createdAt
- Máx. 5 membros, usado por MyFinance, ignorado por MyFit

**User**
- id, name, email, passwordHash, createdAt
- role (OWNER | MEMBER)
- familyGroup (FamilyGroup, nullable)
- products (Set<ProductType>: FINANCE | FITNESS)
- Implementa UserDetails do Spring Security
  → getUsername() retorna email
  → getPassword() retorna passwordHash

**Evoluções futuras do core:**
- [ ] Perfil expandido (avatar, preferências, tema)
- [ ] Convite de membros ao FamilyGroup por e-mail
- [ ] Painel MyLife — visão unificada de todos os produtos
- [ ] SSO para versão mobile

---

### 3.2 Módulo finance — MyFinance ✅ concluído

**Account**
- id, name, bankName, type (CHECKING | SAVINGS | CASH | DIGITAL)
- balance, currency (default BRL), active, createdAt
- owner (User), familyGroup (FamilyGroup)

**Savings**
- id, name, description, targetAmount (opcional)
- currentAmount, cdiRate, currentCdiValue
- estimatedReturn (@Transient: currentAmount * cdiRate/100 * currentCdiValue/100)
- linkedAccount (nullable), owner, familyGroup, createdAt

**SavingsEntry**
- id, savings, type (DEPOSIT | WITHDRAWAL)
- amount, date, note, createdAt

**WishListItem**
- id, name, description, estimatedPrice
- category (ELECTRONICS | CLOTHING | HOME | VEHICLE |
  HEALTH | EDUCATION | LEISURE | FOOD | OTHER)
- priority (HIGH | MEDIUM | LOW)
- estimatedMonth (YearMonth), status (PENDING | PURCHASED | CANCELLED)
- purchasedAt (nullable), linkedTransactionId (Long, nullable)
- linkedAccount (nullable), owner, familyGroup, createdAt

**Transaction**
- id, description, amount, type (INCOME | EXPENSE)
- category (TransactionCategory), date, account, note
- recurrenceType (NONE | AUTOMATIC | MANUAL)
- recurrenceFrequency (DAILY | WEEKLY | MONTHLY | YEARLY, nullable)
- recurrenceEndDate (nullable), recurrenceDay (nullable)
- parentTransaction (nullable), isPending (boolean)
- owner, familyGroup, createdAt

**RecurrencePendingNotification**
- id, transaction, scheduledDate, confirmed (boolean)
- confirmedAt (nullable), owner, createdAt

**CreditCard**
- id, name, lastFourDigits, totalLimit
- closingDay, dueDay, linkedAccount (nullable)
- active, owner, familyGroup, createdAt
- availableLimit (@Transient: totalLimit - soma faturas OPEN+CLOSED)

**Invoice**
- id, creditCard, referenceMonth (YearMonth), dueDate
- totalAmount, status (OPEN | CLOSED | PAID)
- paidAt (nullable), paymentTransactionId (nullable)
- createdAt

**CreditCardTransaction**
- id, creditCard, invoice, description
- totalAmount, installmentAmount
- installmentNumber, totalInstallments
- category (TransactionCategory), purchaseDate, note
- owner, familyGroup, createdAt

**Investment**
- id, name, type (FIXED_INCOME | STOCK | FUND | CRYPTO)
- institution, totalInvested, currentValue
- yieldAmount (@Transient), yieldPercentage (@Transient)
- indexer (CDI | SELIC | IPCA | PREFIXED | OTHER, nullable)
- indexerRate (nullable), fixedRate (nullable)
- currentIndexValue (nullable), maturityDate (nullable)
- estimatedReturn (@Transient, apenas FIXED_INCOME)
- linkedAccount (nullable), active
- owner, familyGroup, createdAt, lastUpdatedAt

**InvestmentEntry**
- id, investment, type (DEPOSIT | WITHDRAWAL | YIELD_UPDATE)
- amount, date, note, previousValue, createdAt
- DEPOSIT: totalInvested += amount, currentValue += amount
- WITHDRAWAL: totalInvested -= amount, currentValue -= amount
- YIELD_UPDATE: currentValue = amount (não altera totalInvested)

**Regras de negócio — MyFinance:**
- Todo registro pertence a um User e FamilyGroup
- OWNER vê consolidado do grupo; MEMBER vê apenas os seus
- balance de Account nunca alterado diretamente — sempre via Transaction
- Ao marcar WishListItem como PURCHASED:
  → gera Transaction (EXPENSE) via TransactionService
  → preenche linkedTransactionId
  → debita linkedAccount via Transaction
- netWorth = saldo contas + cofrinhos + investimentos - dívida cartões

**Evoluções futuras — MyFinance:**
- [ ] CDI automático via API BCB
  https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados
- [ ] Importação de extrato (OFX / Open Finance)
- [ ] Permissões granulares (OWNER / MEMBER / VIEWER)
- [ ] Rendimento histórico do Savings (snapshots mensais)
- [ ] Multi-moeda com conversão automática
- [ ] Notificações: meta Savings, lembrete CDI, estimatedMonth WishList
- [ ] Savings promovido para Investment com histórico preservado
- [ ] WishListItem: imagem/link, comparador de preços, agrupamento
- [ ] Fechar fatura automaticamente via @Scheduled (OPEN → CLOSED)
- [ ] Excluir CreditCardTransaction com reajuste de invoice.totalAmount
- [ ] Investimentos: cotações automáticas (B3, CoinGecko, BCB)
- [ ] Investimentos: compra/venda com preço médio e lucro realizado
- [ ] Relatórios: exportar PDF/Excel
- [ ] Relatórios: parâmetro excludeCategory no breakdown de categorias

---

### 3.3 Módulo fitness — MyFit ⏳ pendente

**Integração com MyFinance:**
- fitness pode importar finance via injeção direta de services
- Exemplo: FitnessShoppingService → WishListService
- finance nunca importa fitness (evita dependência circular)
- Sem chave de API ou HTTP entre módulos — injeção Spring direta

**Evoluções futuras — MyFit:**
- [ ] Registro de treinos e atividades físicas
- [ ] Controle de compras (tênis, suplementos)
  → FitnessShoppingService chama WishListService do finance
- [ ] Metas de condicionamento físico

---

## 4. Padrões de resposta esperados

**Ao gerar código backend:**
- Sempre inclua os imports necessários
- Siga: Controller → Service → Repository
- Entregue sempre o conjunto completo:
  Controller + Service + Repository + DTO + teste unitário
- Nunca exponha entidades JPA — sempre use DTOs
- Bean Validation no DTO de request
- Erros centralizados via @ControllerAdvice (GlobalExceptionHandler)
- Mensagens de erro em português, código em inglês

**Formato de entrega:**
- Separe claramente os arquivos com cabeçalhos
- Comentários apenas onde a lógica não for óbvia
- Ao final aponte:
  → possíveis melhorias
  → riscos ou pontos de atenção
  → o que implementar em seguida

**Ao tomar decisões arquiteturais:**
- Explique o motivo da escolha
- Se houver mais de uma abordagem, apresente antes de implementar
- Mantenha consistência com decisões anteriores
- Sinalize impacto em módulos futuros

---

## 5. Estado do projeto

| Módulo                  | Status          |
|-------------------------|-----------------|
| core — Auth / User      | ✅ concluído    |
| core — FamilyGroup      | ✅ concluído    |
| finance — Contas        | ✅ concluído    |
| finance — Cofrinhos     | ✅ concluído    |
| finance — Lista desejos | ✅ concluído    |
| finance — Transações    | ✅ concluído    |
| finance — Cartão        | ✅ concluído    |
| finance — Investimentos | ✅ concluído    |
| finance — Relatórios    | ✅ concluído    |
| fitness — MyFit         | ⏳ pendente     |


---

## 6. Feature em andamento (preencher a cada sessão)

**Feature atual:** [descreva a feature]

**Contexto desta feature:**
- [o que ela faz]
- [endpoint esperado, se aplicável]
- [módulo: core | finance | fitness]

**Arquivos relevantes já existentes:**
- [liste os arquivos que o Claude deve considerar]

**Tarefa desta sessão:**
[descreva exatamente o que implementar]