# Plan: Bootstrap OlivePro Spring Boot REST API

Turn the empty Spring Boot skeleton at `src/main/java/backend/api/` into a fully-wired REST backend by migrating the base package to `com.olivepro`, adding all required Maven dependencies, building every layer in the priority order defined in `copilot-instructions.md`, and wiring security + cross-cutting concerns. All implementation follows strictly the contracts in `CONTEXT.md`, `API_ROUTES.md`, and `copilot-instructions.md` — no deviations.

---

## Steps

### 1. Fix `pom.xml` and `application.properties`
- Add missing dependencies including Spring Security, validation, JWT libs, WebSocket starter, PostgreSQL drivers, iText/OpenPDF for PDF generation, etc.
- Replace the placeholder `application.properties` with the full template from `copilot-instructions.md`:
  - PostgreSQL datasource config
  - JWT secret + expiration
  - CORS allowed origin
  - Fuel low-stock threshold
  - JPA dialect + DDL auto
  - Logging level

### 2. Rename / re-root the base package
- Move `ApiApplication.java` from `backend.api` → `com.olivepro`
- Rename class to `OliveProApplication`
- Move `ApiApplicationTests.java` accordingly
- Create the full package tree under `src/main/java/com/olivepro/`:
  - `config/`, `controller/`, `service/`, `repository/`, `domain/`, `dto/request/`, `dto/response/`, `enums/`, `exception/`, `security/`, `util/`

### 3. Create all enums (`enums/` package)
| Enum | Values |
|---|---|
| `UserRole` | `SUPER_ADMIN`, `ADMIN`, `SELLER` |
| `ProductType` | `OLIVE`, `NOYAUX`, `HUILE_VRAC`, `HUILE_BOUTEILLE`, `GRIGNONS`, `FITOUR` |
| `Brand` | `ZITLBLAD`, `ASSLIA`, `SERGHINIA`, `KOUTOBIA` |
| `BottleSize` | `_1L`, `_0_5L`, `_2L`, `_5L` |
| `TransactionType` | `ACHAT`, `VENTE`, `PRODUCTION`, `CHARGEMENT_CAMION`, `VERSEMENT` |
| `PaymentMethod` | `ESPECE`, `CAISSE_DIRECTEUR`, `CHEQUE`, `VIREMENT`, `CREDIT`, `TIERS` |
| `PaymentStatus` | `PAYE`, `PARTIEL`, `IMPAYE` |
| `Currency` | `MAD`, `EUR`, `USD` |
| `TankStatus` | `EMPTY`, `FILLING`, `FULL`, `MAINTENANCE` |
| `VehicleType` | `CAMION`, `CAMIONNETTE`, `UTILITAIRE` |
| `VehicleStatus` | `DISPONIBLE`, `EN_MISSION`, `MAINTENANCE` |
| `CheckStatus` | `EN_COFFRE`, `DEPOSE`, `ENCAISSE`, `REJETE` |
| `CheckDirection` | `RECU`, `EMIS` |
| `EmployeeRole` | `OUVRIER`, `EMPLOYE` |
| `AttendanceStatus` | `PRESENT`, `MATIN`, `APRES_MIDI`, `CONGE`, `ABSENT` |
| `FuelLogType` | `ACHAT`, `CONSOMMATION` |
| `ContractStatus` | `EN_COURS`, `TERMINE`, `ANNULE` |
| `EmailFolder` | `INBOX`, `SENT`, `TRASH` |
| `ExpenseCategory` | `ELECTRICITE`, `CARBURANT`, `MAINTENANCE`, `SALAIRES`, `TRANSFERT`, `AUTRE` |

### 4. Create all JPA entities (`domain/` package)
All entities use:
- `@Entity @Table(name = "...")` + Lombok `@Data @NoArgsConstructor @AllArgsConstructor @Builder`
- `@Id @GeneratedValue(strategy = GenerationType.IDENTITY)` (Long PK)
- `@Enumerated(EnumType.STRING)` for all enums
- `FetchType.LAZY` by default on all `@ManyToOne`
- `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)` for compositions
- `LocalDateTime` for timestamps, `LocalDate` for date-only fields
- No business logic in entities

| Entity | Key Fields |
|---|---|
| `User` | `username`, `passwordHash`, `role (UserRole)`, `isBlocked`, `vehicleId (nullable)`, `lastLogin` |
| `StockItem` | `name`, `type (ProductType)`, `quantity`, `unit`, `brand (nullable)`, `bottleSize (nullable)` |
| `Tank` | `name`, `capacity`, `currentLevel`, `acidity`, `waxes`, `avgCost`, `status (TankStatus)` |
| `Transaction` | `type`, `productType`, `quantity`, `unit`, `priceTotal`, `originalAmount`, `currency`, `exchangeRate`, `partnerName`, `vehicleId`, `tankId`, `bankAccountId`, `paymentMethod`, `paymentStatus`, `amountPaid`, `notes`, `gpsLocation`, `createdAt`, `createdBy` |
| `TankDistribution` | `transaction (ManyToOne)`, `tankId`, `quantity` |
| `Expense` | `category (ExpenseCategory)`, `description`, `amount`, `paymentMethod`, `date`, `createdBy` |
| `BankCheck` | `number`, `bank`, `amount`, `dueDate`, `direction (CheckDirection)`, `status (CheckStatus)`, `partnerName`, `createdAt` |
| `BankAccount` | `bankName`, `accountNumber`, `currency`, `balance` |
| `Vehicle` | `plateNumber`, `driverName`, `type (VehicleType)`, `status (VehicleStatus)`, `destination`, `loadType`, `loadQuantity`, `mobileStock (OneToMany MobileStockItem)` |
| `MobileStockItem` | `vehicle (ManyToOne)`, `brand`, `bottleSize`, `quantity`, `unitPrice` |
| `Employee` | `name`, `role (EmployeeRole)`, `baseSalary`, `createdAt` |
| `AttendanceRecord` | `employee (ManyToOne)`, `date`, `status (AttendanceStatus)`, `hoursNormal`, `hoursOvertime`, `advanceAmount` |
| `SalaryPayment` | `employee (ManyToOne)`, `periodStart`, `periodEnd`, `amount`, `method (PaymentMethod)`, `bankAccountId (nullable)`, `paidAt` |
| `FuelLog` | `type (FuelLogType)`, `quantity`, `cost (nullable)`, `vehiclePlate (nullable)`, `vehicleId (nullable)`, `paymentMethod (nullable)`, `createdAt` |
| `Contract` | `clientName`, `reference`, `productType`, `targetQuantity`, `targetAcidity`, `targetWaxes`, `priceSell`, `status (ContractStatus)`, `allocations (OneToMany)`, `createdAt` |
| `ContractAllocation` | `contract (ManyToOne)`, `tankId`, `quantity`, `acidity`, `waxes`, `costPrice`, `allocatedAt` |
| `Invoice` | `invoiceNumber`, `date`, `clientName`, `clientAddress`, `clientIce`, `tvaRate`, `totalHT`, `tvaAmount`, `totalTTC`, `amountInWords`, `paymentMode`, `items (OneToMany InvoiceItem)`, `createdAt` |
| `InvoiceItem` | `invoice (ManyToOne)`, `description`, `quantity`, `unitPrice` |
| `ActivityLog` | `username`, `action`, `details`, `financialAmount (nullable)`, `createdAt` |
| `EmailAccount` | `displayName`, `email`, `messages (OneToMany)` |
| `EmailMessage` | `account (ManyToOne)`, `fromAddress`, `toAddress`, `subject`, `body`, `folder (EmailFolder)`, `isRead`, `sentAt` |

### 5. Create all repositories (`repository/` package)
One `JpaRepository<Entity, Long>` per entity. Custom query methods where needed:

| Repository | Notable custom queries |
|---|---|
| `UserRepository` | `findByUsername(String)`, `findByUsernameAndIsBlockedFalse(String)` |
| `StockItemRepository` | `findByNameAndTypeAndBrandAndBottleSize(...)` (for merge logic) |
| `TransactionRepository` | `findByType(...)`, `findByPartnerName(...)`, `findByVehicleId(...)`, `findByCreatedAtBetween(...)` |
| `TankRepository` | standard CRUD |
| `ExpenseRepository` | `findByCategory(...)`, `findByDateBetween(...)` |
| `BankCheckRepository` | `findByDirectionAndStatus(...)`, `findByStatusAndDueDateBefore(LocalDate)` (urgent) |
| `AttendanceRepository` | `findByEmployeeIdAndDateBetween(...)` |
| `SalaryPaymentRepository` | `findByEmployeeId(...)` |
| `FuelLogRepository` | `findAll()` (derived stock sum in service) |
| `ContractRepository` | `findByStatus(ContractStatus)` |
| `InvoiceRepository` | `findTopByOrderByIdDesc()` (for next number) |
| `ActivityLogRepository` | `findByUsernameOrderByCreatedAtDesc(...)`, `findAllByOrderByCreatedAtDesc(Pageable)` |
| `EmailMessageRepository` | `findByAccountIdAndFolder(...)`, `countByAccountIdAndFolderAndIsReadFalse(...)` |

### 6. Build the security layer (`security/` package)

#### `JwtUtil.java`
- Generate token with claims: `userId`, `username`, `role`, `vehicleId` (nullable)
- Validate token (signature + expiry)
- Extract individual claims
- Secret key and expiry from `@Value("${app.jwt.secret}")` and `@Value("${app.jwt.expiration-ms}")`

#### `JwtAuthFilter.java` (extends `OncePerRequestFilter`)
- Extract `Authorization: Bearer <token>` header
- Validate token via `JwtUtil`
- Load `UserDetails` from `UserDetailsServiceImpl`
- **Check `User.isBlocked`** — if blocked, abort with `403` immediately (do not set auth in context)
- Set `SecurityContextHolder` authentication

#### `UserDetailsServiceImpl.java`
- Implements `UserDetailsService`
- Loads `User` from `UserRepository` by username
- Throws `UsernameNotFoundException` if not found
- Throws `LockedException` if `isBlocked = true`
- Maps `UserRole` to Spring Security `GrantedAuthority`

#### `SecurityConfig.java`
- Stateless sessions (`SessionCreationPolicy.STATELESS`)
- Disable CSRF
- Permit only `POST /api/auth/login` without token
- All other paths require authentication
- Add `JwtAuthFilter` before `UsernamePasswordAuthenticationFilter`
- Configure CORS from `@Value("${app.cors.allowed-origin}")`
- Enable `@PreAuthorize` via `@EnableMethodSecurity`

### 7. Real-time WebSocket Alerts (NEW)
- Add `spring-boot-starter-websocket` to `pom.xml`.
- Implement a native WebSocket endpoint at `/ws/alerts`:
  - Create `WebSocketConfig.java` to register a `TextWebSocketHandler` at `/ws/alerts`.
  - Implement `AlertsWebSocketHandler` extending `TextWebSocketHandler` that validates the JWT passed as a `?token=` query parameter in `afterConnectionEstablished`. If invalid/blocked, close the session.
  - Maintain a concurrent map of sessions in an `AlertsSessionRegistry` component.
  - Implement `AlertsBroadcaster` (`@Component`) with a `broadcast()` method that computes the current alerts payload and sends it to all connected sessions as JSON.
  - Ensure services that mutate data (EmailService, AccountingService checks, FuelService, TankService) call `alertsBroadcaster.broadcast()` after successful mutations.
  - Add unit tests for the handler and broadcaster.

> Note: The WebSocket approach uses native WebSocket (no STOMP/SockJS) to keep the implementation simple and lightweight. The frontend will connect using the browser's native `WebSocket` API and include the JWT in the `token` query parameter.

### 8. Implement Auth + seed (`config/` + `controller/` + `service/`)

#### `AuthService.java`
- `login(username, password)`: authenticate, check `isBlocked`, update `lastLogin`, return `LoginResponse { token, username, role, vehicleId }`
- `logout()`: client-side only (stateless JWT) — return success message
- `getMe(Authentication)`: return current user profile

#### `AuthController.java`
- `POST /api/auth/login` 🔓
- `POST /api/auth/logout` 🛡️+🚚
- `GET /api/auth/me` 🛡️+🚚

#### `DataInitializer.java` (implements `CommandLineRunner`)
- Run only on first boot (check if users already exist)
- Create BCrypt-hashed seed users: `mojo`, `boss` (SUPER_ADMIN), `hajar`, `safae` (ADMIN)
- Create internal email accounts: direction, commercial, rh, logistique
- Send welcome `EmailMessage` to `direction@marrakech-agro.com` INBOX

### 9. Core services & controllers (priority order)

#### 9.1 Stock (`StockService` + `StockController`)
- `GET /api/stock` — list with optional `type` filter + pagination
- `POST /api/stock` — create or merge (find existing by name+type+brand+bottleSize → add quantity)
- `PATCH /api/stock/{id}/quantity` — delta adjustment, reject if result < 0
- `DELETE /api/stock/{id}` — remove item
- Business rule: quantity never goes negative → throw `InsufficientStockException`

#### 9.2 Tank (`TankService` + `TankController`)
- `GET /api/tanks` — list with derived stats (usagePercentage, stockValue, availableCapacity)
- `POST /api/tanks` — create new tank
- `PUT /api/tanks/{id}` — update metadata / set MAINTENANCE status
- `DELETE /api/tanks/{id}` — only if `currentLevel == 0`
- `POST /api/tanks/transfer` — transfer oil between tanks with weighted avg recalculation
- Weighted average recalculation method (reused by TransactionService + ProductionService):
  ```
  newAcidity = ((currentLevel * currentAcidity) + (addedQty * addedAcidity)) / newLevel
  newWaxes   = ((currentLevel * currentWaxes)   + (addedQty * addedWaxes))   / newLevel
  newAvgCost = ((currentLevel * avgCost)         + (addedQty * unitCost))     / newLevel
  ```
- Auto-update tank status after every level change

#### 9.3 Transaction (`TransactionService` + `TransactionController`)
- `GET /api/transactions` — list with filters (type, partner, date range) + pagination
- `POST /api/transactions` — create with side effects (all atomic `@Transactional`):
  1. If `HUILE_VRAC` → update tank levels via `TankService`; if ACHAT/PRODUCTION → recalculate weighted avg
  2. If `paymentMethod == VIREMENT && bankAccountId != null` → update `BankAccount.balance`
  3. Log to `ActivityLog`
- `DELETE /api/transactions/{id}` — delete (no reversal of side effects)
- `GET /api/transactions/partners/report` — grouped partner summary
- `GET /api/transactions/partners/{partnerName}/balance` — net balance for a partner

#### 9.4 Production (`ProductionService` + `ProductionController`)
- `POST /api/production` — atomic 5-step process:
  1. Deduct `inputQuantity` from `StockItem[inputStockId]` (reject if insufficient)
  2. Add `outputOilQty` to `Tank[outputTankId]` via `TankService.fillTank(...)` (weighted avg)
  3. Merge `grignonsQty` into GRIGNONS `StockItem` (create if not exists)
  4. Merge `fitourQty` into FITOUR `StockItem` (create if not exists)
  5. Create `PRODUCTION` transaction + log to `ActivityLog`
- `GET /api/production/history` — all PRODUCTION transactions

### 10. Remaining modules (services + controllers)

#### 10.1 Accounting (`AccountingService` + `AccountingController`) — `SUPER_ADMIN` only
- `GET /api/accounting/summary` — derived caisse calculation (never stored), net profit, receivables, payables, bank totals
- `GET /api/accounting/expenses` + `POST` + `DELETE`
- `POST /api/accounting/cash/manual` — manual income/outgo expense entry
- `POST /api/accounting/cash/transfer-directeur` — creates TRANSFERT expense
- `POST /api/accounting/cash/transfer-bank` — updates `BankAccount.balance` + TRANSFERT expense
- `GET /api/accounting/checks` + `POST` + `DELETE` + `PATCH /{id}/status`
- `GET /api/accounting/checks/urgent` — EN_COFFRE checks with dueDate within 3 days
- `GET /api/accounting/bank-accounts` + `POST` + `PUT /{id}`
- Caisse calculation formula (recalculated on every summary request):
  - `caisseUsine = Σ(ESPECE VENTE amountPaid) + Σ(VERSEMENT amountPaid) - Σ(ESPECE ACHAT amountPaid) - Σ(ESPECE expenses where amount > 0) + Σ(ESPECE expenses where amount < 0 [income])`
  - `caisseDirecteur = Σ(CAISSE_DIRECTEUR income transactions) - Σ(CAISSE_DIRECTEUR expenses)`

#### 10.2 Vehicle (`VehicleService` + `VehicleController`)
- `GET /api/vehicles` + `POST` + `DELETE`
- `PATCH /api/vehicles/{id}/mission` — update status/destination
- `POST /api/vehicles/{id}/load` — deduct factory `StockItem` qty, merge into `mobileStock`, create `CHARGEMENT_CAMION` transaction
- `POST /api/vehicles/{id}/mobile-sale` — create VENTE transactions per item, deduct `mobileStock`
- `GET /api/vehicles/{id}/stats` — derived seller stats

#### 10.3 Seller Portal (`SellerController` — `/api/seller/**`) — `SELLER` role only
- All endpoints scoped to `vehicleId` extracted from JWT (never trusting user input for vehicle ID)
- `GET /api/seller/vehicle` — own vehicle + mobileStock
- `GET /api/seller/transactions` — own transactions
- `POST /api/seller/sale` — same logic as vehicle mobile-sale but scoped to JWT vehicleId
- `POST /api/seller/cash-drop` — create VERSEMENT transaction + negative Expense in caisse
- `GET /api/seller/stats` — own seller stats

#### 10.4 HR (`HRService` + `HRController`)
- `GET /api/hr/employees` + `POST` + `DELETE`
- `GET /api/hr/attendance` + `PUT /api/hr/attendance/{id}`
- `GET /api/hr/salary/calculate` — calculate (no save): OUVRIER = Σ(days × baseSalary × coefficient) + overtime; EMPLOYE = fixed baseSalary
- `POST /api/hr/salary/pay` — `SUPER_ADMIN` only: save `SalaryPayment`, create SALAIRES `Expense` (if ESPECE) or debit `BankAccount` (if VIREMENT)
- `GET /api/hr/salary/history` + `DELETE /api/hr/salary/{id}`

#### 10.5 Fuel (`FuelService` + `FuelController`)
- `GET /api/fuel/stock` — derived from all logs: `Σ(ACHAT qty) - Σ(CONSOMMATION qty)`, low stock flag
- `GET /api/fuel/logs` — all fuel logs
- `POST /api/fuel/purchase` — create ACHAT FuelLog + CARBURANT Expense
- `POST /api/fuel/consume` — create CONSOMMATION FuelLog, reject if insufficient stock
- `DELETE /api/fuel/logs/{id}`

#### 10.6 Contracts (`ContractService` + `ContractController`)
- `GET /api/contracts` + `POST` + `DELETE` (only if ANNULE)
- `POST /api/contracts/{id}/allocate` — deduct from tank, create `ContractAllocation`, auto-set TERMINE if fully allocated
- `GET /api/contracts/{id}/stats` — derived: avgAcidity, avgWaxes (weighted avg of allocations), profit, margin
- `PATCH /api/contracts/{id}/status` — manual status change

#### 10.7 Invoices (`InvoiceService` + `InvoiceController`)
- `GET /api/invoices` + `GET /api/invoices/{id}` + `POST` + `DELETE`
- Auto-number generation: find max sequential number for current year + 1, format as `<n>/<yy>`
- Auto-calculate `totalHT`, `tvaAmount`, `totalTTC`, `amountInWords` (via `NumberToWordsFr` util)
- `GET /api/invoices/{id}/pdf` — generate PDF with iText 7 (company letterhead, items table, totals, TVA breakdown); return as `application/pdf`
- `GET /api/invoices/next-number` — preview next number

#### 10.8 Email (`EmailService` + `EmailController`)
- `GET /api/email/accounts` + `POST`
- `GET /api/email/messages?accountId=&folder=` — messages in a folder
- `POST /api/email/send` — if recipient is a known internal email → create INBOX copy for recipient; always save SENT copy for sender
- `PATCH /api/email/messages/{id}/read` — mark as read
- `PATCH /api/email/messages/{id}/trash` — move to TRASH folder
- `DELETE /api/email/messages/{id}`
- `GET /api/email/accounts/{id}/unread-count`

#### 10.9 Dashboard (`DashboardService` + `DashboardController`)
- `GET /api/dashboard/stats` — KPIs: totalSales, netProfit, totalOilVolume, totalOilCapacity, capacityUtilizationPercent, totalTransactionCount
- `GET /api/dashboard/chart/weekly-sales` — last 7 days, grouped by day with French day label
- `GET /api/dashboard/alerts` — unreadEmails, urgentChecks, lowFuel (bool), lowTankCount

#### 10.10 Activity Log (`ActivityLogService` + `ActivityLogController`)
- `ActivityLogService.log(username, action, details, amount?)` — internal method called by all other services
- `GET /api/logs` — paginated, newest first, filterable by username + date range
- `GET /api/logs/user/{username}` — logs for a specific user
- No delete endpoint (append-only)

#### 10.11 Admin Panel (`AdminController`) — `SUPER_ADMIN` only
- `GET /api/admin/users` — list users with role + blocked status
- `POST /api/admin/users/block` — block user; reject if target is `mojo` or `boss`
- `POST /api/admin/users/unblock` — unblock user

### 11. Global exception handling (`exception/` package)

#### Custom exceptions
| Exception | HTTP Status |
|---|---|
| `ResourceNotFoundException` | 404 |
| `InsufficientStockException` | 400 |
| `BusinessRuleException` | 400 |
| `UnauthorizedException` | 403 |

#### `GlobalExceptionHandler.java` (`@RestControllerAdvice`)
Handles and maps to unified error JSON:
```json
{
  "timestamp": "2026-02-24T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "...",
  "path": "/api/..."
}
```
- `ResourceNotFoundException` → 404
- `InsufficientStockException` → 400
- `BusinessRuleException` → 400
- `UnauthorizedException` → 403
- `MethodArgumentNotValidException` → 400 (list all field errors)
- `AccessDeniedException` → 403
- `LockedException` → 403 (blocked user)
- `Exception` (fallback) → 500

### 12. Utility classes (`util/` package)

#### `NumberToWordsFr.java`
- Converts a numeric `BigDecimal` or `double` to French text
- Used by `InvoiceService` to populate `amountInWords`
- Example: `1200.0` → `"Mille deux cents dirhams"`

#### `WeightedAverageUtil.java`
- Static helper method reused by `TankService`, `TransactionService`, `ProductionService`, `ContractService`
- Encapsulates the weighted average formula to avoid duplication

---

## Further Considerations / Open Questions

1. **Spring Boot version mismatch** — `pom.xml` currently declares Spring Boot `4.0.3`, but `CONTEXT.md` and `copilot-instructions.md` specify **Spring Boot 3.x**. Spring Boot 4 does not exist publicly yet. Should the version stay as `4.0.3` (as initialized) or be downgraded to the latest `3.4.x` stable to match the documented stack?

2. **JWT dependency alignment** — `pom.xml` has no JWT or Spring Security dependencies yet. The plan adds `io.jsonwebtoken:jjwt-*:0.12.6` as instructed. Confirm the secret key will be at least 256-bit and stored in `application.properties` (not committed to git).

3. **Package root** — the skeleton is under `backend.api`; the instructions mandate `com.olivepro`. The plan renames/moves the entry point. All new files will go under `com.olivepro` — confirm this is acceptable before implementation starts.



