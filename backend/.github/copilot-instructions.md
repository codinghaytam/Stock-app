# GitHub Copilot Instructions — OlivePro Spring Boot Backend

## Project Identity

You are building the **Java Spring Boot 3 backend** for **OlivePro**, a factory management system for an olive-oil production company. Read `CONTEXT.md` in this folder before making any changes — it contains the full business logic specification.

---

## Tech Stack (strict — do not deviate)

- **Java 21**
- **Spring Boot 3.x** (latest stable)
- **Maven** (pom.xml, NOT Gradle)
- **Spring Security 6** with **JWT** (`io.jsonwebtoken:jjwt-api` + `jjwt-impl` + `jjwt-jackson`, version 0.12.x)
- **Spring Data JPA** + **Hibernate**
- **PostgreSQL** (main DB), **H2** (test scope only)
- **Lombok** (reduce boilerplate — use `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`)
- **Jakarta Bean Validation** for all DTOs
- **iText 7** (`com.itextpdf:itext7-core`) for PDF invoice generation
- **MapStruct** (optional, only if DTOs require complex mapping)

---

## Project Structure

Always place files in these exact packages under `src/main/java/com/olivepro/`:

```
com.olivepro
├── OliveProApplication.java          ← @SpringBootApplication
├── config/
│   ├── SecurityConfig.java           ← Spring Security filter chain, CORS
│   ├── JwtConfig.java                ← JWT secret, expiry from application.properties
│   └── DataInitializer.java          ← @Component CommandLineRunner for DB seeding
├── controller/
│   ├── AuthController.java
│   ├── StockController.java
│   ├── TankController.java
│   ├── TransactionController.java
│   ├── ProductionController.java
│   ├── AccountingController.java
│   ├── VehicleController.java
│   ├── HRController.java
│   ├── FuelController.java
│   ├── ContractController.java
│   ├── InvoiceController.java
│   ├── EmailController.java
│   ├── DashboardController.java
│   ├── ActivityLogController.java
│   └── AdminController.java
├── service/
│   ├── AuthService.java
│   ├── StockService.java
│   ├── TankService.java
│   ├── TransactionService.java
│   ├── ProductionService.java
│   ├── AccountingService.java
│   ├── VehicleService.java
│   ├── HRService.java
│   ├── FuelService.java
│   ├── ContractService.java
│   ├── InvoiceService.java
│   ├── EmailService.java
│   ├── DashboardService.java
│   └── ActivityLogService.java
├── repository/
│   └── (one JpaRepository interface per entity)
├── domain/
│   ├── User.java
│   ├── Tank.java
│   ├── StockItem.java
│   ├── Vehicle.java
│   ├── MobileStockItem.java
│   ├── Transaction.java
│   ├── TankDistribution.java
│   ├── Expense.java
│   ├── BankCheck.java
│   ├── BankAccount.java
│   ├── Employee.java
│   ├── AttendanceRecord.java
│   ├── SalaryPayment.java
│   ├── FuelLog.java
│   ├── Contract.java
│   ├── ContractAllocation.java
│   ├── Invoice.java
│   ├── InvoiceItem.java
│   ├── ActivityLog.java
│   ├── EmailAccount.java
│   └── EmailMessage.java
├── dto/
│   ├── request/      ← Inbound DTOs (what the API receives)
│   └── response/     ← Outbound DTOs (what the API returns)
├── enums/
│   └── (all enums: UserRole, ProductType, Brand, TransactionType, etc.)
├── exception/
│   ├── GlobalExceptionHandler.java   ← @RestControllerAdvice
│   ├── ResourceNotFoundException.java
│   ├── InsufficientStockException.java
│   ├── BusinessRuleException.java
│   └── UnauthorizedException.java
├── security/
│   ├── JwtUtil.java                  ← token generation, validation, claims extraction
│   ├── JwtAuthFilter.java            ← OncePerRequestFilter
│   └── UserDetailsServiceImpl.java   ← loads UserDetails from DB
└── util/
    ├── NumberToWordsFr.java           ← French number-to-words for invoice
    └── WeightedAverageUtil.java       ← reusable weighted avg calculator
```

---

## Code Generation Rules

### 1. Entities (domain/)

- Annotate with `@Entity`, `@Table(name = "...")`
- Use `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` for all primary keys (Long)
- All relationships: prefer `@ManyToOne(fetch = FetchType.LAZY)` unless there's a strong reason for EAGER
- `@OneToMany` with `cascade = CascadeType.ALL, orphanRemoval = true` for compositions (e.g., Invoice → InvoiceItem)
- Store enums as strings: `@Enumerated(EnumType.STRING)`
- Use `LocalDateTime` for timestamps, `LocalDate` for date-only fields
- Add Lombok: `@Data @NoArgsConstructor @AllArgsConstructor @Builder`
- Do NOT put business logic in entities — only pure data + simple derived getters

### 2. DTOs (dto/)

- Create separate `*Request` and `*Response` DTOs — never expose entities directly
- Use Jakarta validation on Request DTOs:
  - `@NotBlank`, `@NotNull`, `@Min`, `@Max`, `@Positive`, `@Email`, `@Size`
- Response DTOs should be plain POJOs or Java records
- Never return passwords or internal implementation details

### 3. Services (service/)

- Annotate with `@Service @Transactional`
- All business logic lives here — NOT in controllers, NOT in entities
- Controllers only: parse request, call service, return response
- Services call repositories and other services (inject via constructor, not `@Autowired` field injection)
- Throw custom exceptions (`ResourceNotFoundException`, `InsufficientStockException`, `BusinessRuleException`) — never return null for domain objects
- Log significant actions via `ActivityLogService.log(...)` — call it at end of methods that mutate state

### 4. Controllers (controller/)

- Annotate with `@RestController @RequestMapping("/api/<module>") @RequiredArgsConstructor`
- Method-level security: use `@PreAuthorize("hasRole('SUPER_ADMIN')")` or similar
- Return `ResponseEntity<T>` always
- HTTP verbs: `GET` (read), `POST` (create), `PUT` (full update), `PATCH` (partial update/status change), `DELETE`
- Paginate large list endpoints: accept `@RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="50") int size`

### 5. Security (security/)

- JWT filter runs before `UsernamePasswordAuthenticationFilter`
- Extract `userId`, `username`, `role`, and `vehicleId` (for sellers) as JWT claims
- Check `User.isBlocked` in `UserDetailsServiceImpl` — throw `LockedException` if blocked
- Security config: stateless sessions, disable CSRF, permit only `/api/auth/**` without token
- CORS: allow frontend origin from `application.properties` (`app.cors.allowed-origin`)

### 6. Error Handling

```java
// GlobalExceptionHandler must handle:
// ResourceNotFoundException       → 404
// InsufficientStockException      → 400
// BusinessRuleException           → 400  
// UnauthorizedException           → 403
// MethodArgumentNotValidException → 400 (validation errors, list all field errors)
// AccessDeniedException           → 403
// Exception (fallback)            → 500
```

Return errors in this JSON format:
```json
{
  "timestamp": "2026-02-24T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Insufficient stock for item: ZITLBLAD 1L",
  "path": "/api/stock/123"
}
```

---

## Business Logic Reminders (Critical)

These must be implemented exactly as specified in CONTEXT.md:

### Weighted Average (Tank fills)
```java
// Called every time oil is added to a tank (purchase OR production)
double newLevel = tank.getCurrentLevel() + addedQty;
double newAcidity = ((tank.getCurrentLevel() * tank.getAcidity()) + (addedQty * addedAcidity)) / newLevel;
double newWaxes   = ((tank.getCurrentLevel() * tank.getWaxes())   + (addedQty * addedWaxes))   / newLevel;
double newAvgCost = ((tank.getCurrentLevel() * tank.getAvgCost()) + (addedQty * unitCost))      / newLevel;
// Round acidity to 2 decimal places, waxes to integer, avgCost to 2 decimal places
```

### Caisse Calculation (never stored)
```java
// Recalculate on every /api/accounting/summary request:
double caisseUsine = transactions.stream()
    .filter(t -> t.getPaymentMethod() == ESPECE)
    .mapToDouble(t -> isSale(t) ? t.getAmountPaid() : -t.getAmountPaid())
    .sum()
    - expenses.stream().filter(e -> e.getPaymentMethod() == ESPECE && e.getAmount() > 0).mapToDouble(Expense::getAmount).sum()
    + expenses.stream().filter(e -> e.getPaymentMethod() == ESPECE && e.getAmount() < 0).mapToDouble(e -> -e.getAmount()).sum();
```

### Fuel Stock (never stored)
```java
// Recalculate current fuel stock from logs:
double currentStock = fuelLogs.stream()
    .mapToDouble(log -> log.getType() == ACHAT ? log.getQuantity() : -log.getQuantity())
    .sum();
```

### Invoice Number Generation
```java
// Format: "<sequential>/<2-digit-year>" e.g., "76/25"
// Find max sequential number from existing invoices for current year, increment by 1
```

### Contract Auto-Termination
```java
// After every allocation, check:
if (contract.getTotalAllocated() >= contract.getTargetQuantity()) {
    contract.setStatus(ContractStatus.TERMINE);
}
```

---

## application.properties Template

```properties
# Server
server.port=8080

# Database (PostgreSQL)
spring.datasource.url=jdbc:postgresql://localhost:5432/olivepro
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT
app.jwt.secret=your-256-bit-secret-key-change-in-production
app.jwt.expiration-ms=86400000

# CORS
app.cors.allowed-origin=http://localhost:5173

# Fuel low-stock threshold
app.fuel.low-stock-threshold=500

# Logging
logging.level.com.olivepro=INFO
```

---

## pom.xml Key Dependencies

```xml
<!-- Spring Boot Starters -->
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-web</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-jpa</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-security</artifactId></dependency>
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-validation</artifactId></dependency>

<!-- JWT -->
<dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-api</artifactId><version>0.12.6</version></dependency>
<dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-impl</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>
<dependency><groupId>io.jsonwebtoken</groupId><artifactId>jjwt-jackson</artifactId><version>0.12.6</version><scope>runtime</scope></dependency>

<!-- Database -->
<dependency><groupId>org.postgresql</groupId><artifactId>postgresql</artifactId><scope>runtime</scope></dependency>
<dependency><groupId>com.h2database</groupId><artifactId>h2</artifactId><scope>test</scope></dependency>

<!-- Lombok -->
<dependency><groupId>org.projectlombok</groupId><artifactId>lombok</artifactId><optional>true</optional></dependency>

<!-- PDF Generation -->
<dependency><groupId>com.itextpdf</groupId><artifactId>itext7-core</artifactId><version>8.0.5</version><type>pom</type></dependency>

<!-- Testing -->
<dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-test</artifactId><scope>test</scope></dependency>
<dependency><groupId>org.springframework.security</groupId><artifactId>spring-security-test</artifactId><scope>test</scope></dependency>
```

---

## What to Implement First (Priority Order)

1. `pom.xml` + project skeleton + `application.properties`
2. All enums (`enums/` package)
3. All JPA entities (`domain/`) with relationships
4. All repositories (`repository/`)
5. Security: `JwtUtil`, `JwtAuthFilter`, `UserDetailsServiceImpl`, `SecurityConfig`
6. `AuthService` + `AuthController` + `DataInitializer` (seed users)
7. Core services in order: `StockService` → `TankService` → `TransactionService` → `ProductionService`
8. `AccountingService` → `VehicleService` → `HRService` → `FuelService`
9. `ContractService` → `InvoiceService` → `EmailService`
10. `DashboardService` → `ActivityLogService` → `AdminController`
11. Global exception handler + validation wiring
12. Tests for each service layer

---

## What NOT to Do

- ❌ Do NOT use `@Autowired` field injection — use constructor injection only
- ❌ Do NOT return JPA entities from controllers — always use DTOs
- ❌ Do NOT store computed values (caisse balance, fuel stock, contract progress) as entity fields
- ❌ Do NOT hardcode user passwords in plain text — always BCrypt
- ❌ Do NOT use `FetchType.EAGER` by default
- ❌ Do NOT skip `@Transactional` on service methods that write to DB
- ❌ Do NOT allow sellers to access any endpoint outside `/api/seller/**`
- ❌ Do NOT allow `ADMIN` (hajar/safae) to access `/api/accounting/**` or `/api/admin/**`
- ❌ Do NOT let anyone block `mojo` or `boss`

