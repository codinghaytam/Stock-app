# OlivePro Backend — Project Status Report

> **Generated:** 2026-03-08  
> **Spring Boot Version:** 4.0.3 | **Java:** 21 | **Database:** PostgreSQL  
> **Base package:** `com.olivepro`

---

## Overall Status: 🟡 ~80% Complete — Core working, several endpoints / sub-features missing

---

## ✅ DONE — Fully Implemented

### Infrastructure & Configuration
| Item | Status | Notes |
|---|---|---|
| `pom.xml` | ✅ | Spring Boot 4.0.3, PostgreSQL, JWT (jjwt 0.12.6), iTextPDF 8.0.5, Lombok, WebSocket, Validation, SpringDoc OpenAPI 3.0.1 |
| `application.properties` | ✅ | PostgreSQL datasource, JWT config, CORS, fuel threshold, logging |
| Base package migration | ✅ | `com.olivepro` fully in place |
| `OliveProApplication.java` | ✅ | Entry point correct |

### Security Layer
| Item | Status | Notes |
|---|---|---|
| `JwtUtil.java` | ✅ | Generate + parse + validate tokens with role/userId/vehicleId claims |
| `JwtAuthFilter.java` | ✅ | Extracts Bearer token, sets SecurityContext |
| `UserDetailsServiceImpl.java` | ✅ | Loads user, checks isBlocked |
| `SecurityConfig.java` | ✅ | Stateless JWT, CORS from env, `@EnableMethodSecurity`, WebSocket `/ws/alerts` permitted |
| `AuthenticationManagerConfig.java` | ✅ | Auth manager bean |

### WebSocket Real-Time Alerts
| Item | Status | Notes |
|---|---|---|
| `WebSocketConfig.java` | ✅ | Native WS handler registered at `/ws/alerts` |
| `AlertsWebSocketHandler.java` | ✅ | JWT validation on connect, blocks blocked users |
| `AlertsSessionRegistry.java` | ✅ | Concurrent session map |
| `AlertsBroadcaster.java` | ✅ | Computes and pushes alerts JSON to all open sessions |

### Domain Entities (21 total)
| Entity | Status |
|---|---|
| `User` | ✅ |
| `StockItem` | ✅ |
| `Tank` | ✅ |
| `TankDistribution` | ✅ |
| `Transaction` | ✅ |
| `Expense` | ✅ |
| `BankCheck` | ✅ |
| `BankAccount` | ✅ |
| `Vehicle` | ✅ |
| `MobileStockItem` | ✅ |
| `Employee` | ✅ |
| `AttendanceRecord` | ✅ |
| `SalaryPayment` | ✅ |
| `FuelLog` | ✅ |
| `Contract` | ✅ |
| `ContractAllocation` | ✅ |
| `Invoice` | ✅ |
| `InvoiceItem` | ✅ |
| `ActivityLog` | ✅ |
| `EmailAccount` | ✅ |
| `EmailMessage` | ✅ |

### Enums (19 total)
| Enum | Status | Values |
|---|---|---|
| `UserRole` | ✅ | `SUPER_ADMIN`, `ADMIN`, `SELLER` |
| `ProductType` | ✅ | `OLIVE`, `NOYAUX`, `HUILE_VRAC`, `HUILE_BOUTEILLE`, `GRIGNONS`, `FITOUR` |
| `Brand` | ✅ | `ZITLBLAD`, `BARAKA`, `ATLAS`, `AUTRE` |
| `BottleSize` | ✅ | `ML_500`, `L_1`, `L_2`, `L_5` |
| `TransactionType` | ✅ | `ACHAT`, `VENTE`, `PRODUCTION`, `CHARGEMENT_CAMION`, `VERSEMENT` |
| `PaymentMethod` | ✅ | `ESPECE`, `CAISSE_DIRECTEUR`, `CHEQUE`, `VIREMENT`, `CREDIT`, `TIERS` |
| `PaymentStatus` | ✅ | `PAYE`, `PARTIEL`, `IMPAYE` |
| `Currency` | ✅ | `MAD`, `EUR`, `USD` |
| `TankStatus` | ✅ | `EMPTY`, `FILLING`, `FULL`, `MAINTENANCE` |
| `VehicleType` | ✅ | `CAMION`, `CAMIONNETTE`, `UTILITAIRE` |
| `VehicleStatus` | ✅ | `DISPONIBLE`, `EN_MISSION`, `MAINTENANCE` |
| `CheckStatus` | ✅ | `EN_COFFRE`, `DEPOSE`, `ENCAISSE`, `REJETE` |
| `CheckDirection` | ✅ | `RECU`, `EMIS` |
| `EmployeeRole` | ✅ | `OUVRIER`, `EMPLOYE` |
| `AttendanceStatus` | ✅ | `PRESENT`, `MATIN`, `APRES_MIDI`, `CONGE`, `ABSENT` (with `coefficient()`) |
| `FuelLogType` | ✅ | `ACHAT`, `CONSOMMATION` |
| `ContractStatus` | ✅ | `EN_COURS`, `TERMINE`, `ANNULE` |
| `EmailFolder` | ✅ | `INBOX`, `SENT`, `TRASH` |
| `ExpenseCategory` | ✅ | `ELECTRICITE`, `CARBURANT`, `MAINTENANCE`, `SALAIRES`, `TRANSFERT`, `AUTRE` |

### Repositories (19 total)
| Repository | Status | Custom Queries |
|---|---|---|
| `UserRepository` | ✅ | `findByUsername` |
| `StockItemRepository` | ✅ | `findByProductTypeAndNameAndBrandAndBottleSize`, `findFirstByProductType` |
| `TankRepository` | ✅ | `findAllByOrderByCreatedAtDesc` |
| `TransactionRepository` | ✅ | `findByType`, `findByVehicleId`, `findByCreatedAtBetween`, `sumTotalSales`, `sumTotalPurchases`, `sumAmountPaidByPaymentMethod`, `sumVersements` |
| `ExpenseRepository` | ✅ | `sumPositiveByPaymentMethod`, `sumNegativeByPaymentMethod`, `sumAllPositive` |
| `BankCheckRepository` | ✅ | `findByStatusAndDueDateBefore` |
| `BankAccountRepository` | ✅ | Standard CRUD |
| `VehicleRepository` | ✅ | `existsByPlateNumber` |
| `MobileStockItemRepository` | ✅ | `findByVehicleId`, `findByVehicleIdAndBrandAndBottleSize` |
| `EmployeeRepository` | ✅ | `findByIsActiveTrue` |
| `AttendanceRecordRepository` | ✅ | `findByEmployeeIdAndDateBetween`, `findByEmployeeIdAndDate` |
| `SalaryPaymentRepository` | ✅ | `findByEmployeeId` |
| `FuelLogRepository` | ✅ | `sumPurchased`, `sumConsumed`, `findAllByOrderByCreatedAtDesc` |
| `ContractRepository` | ✅ | Standard CRUD |
| `ContractAllocationRepository` | ✅ | `sumQuantityByContractId`, `findByContractId` |
| `InvoiceRepository` | ✅ | `findLatest` |
| `ActivityLogRepository` | ✅ | `findAllByOrderByCreatedAtDesc(Pageable)`, `findByUsernameOrderByCreatedAtDesc` |
| `EmailAccountRepository` | ✅ | `findByAddress` |
| `EmailMessageRepository` | ✅ | `findByAccountIdAndFolderOrderByCreatedAtDesc`, `countByAccountIdAndFolderAndIsReadFalse`, `countByFolderAndIsReadFalse` |

### Exception Handling
| Item | Status |
|---|---|
| `ResourceNotFoundException` (404) | ✅ |
| `InsufficientStockException` (400) | ✅ |
| `BusinessRuleException` (400) | ✅ |
| `UnauthorizedException` (403) | ✅ |
| `GlobalExceptionHandler` | ✅ with logging |

### Utility Classes
| Item | Status |
|---|---|
| `NumberToWordsFr.java` | ✅ |
| `WeightedAverageUtil.java` | ✅ |

### Seed / Config
| Item | Status | Notes |
|---|---|---|
| `DataInitializer.java` | ✅ | Seeds users (mojo, boss, hajar, safae) + email accounts + welcome message |
| `JacksonConfig.java` | ✅ | JSON serialization config |

---

## ✅ DONE — Modules (Services + Controllers)

### Authentication — `/api/auth`
| Route | Status | Notes |
|---|---|---|
| `POST /api/auth/login` | ✅ | Returns token + role + vehicleId |
| `POST /api/auth/logout` | ✅ | Stateless (client-side) |
| `GET /api/auth/me` | ✅ | Returns full user profile |

### Stock Management — `/api/stock`
| Route | Status | Notes |
|---|---|---|
| `GET /api/stock` | ✅ | Lists all items |
| `POST /api/stock` | ✅ | Create or merge by (name+type+brand+bottleSize) |
| `DELETE /api/stock/{id}` | ✅ | |
| `PATCH /api/stock/{id}/quantity` | ❌ | **MISSING** — delta adjustment endpoint not implemented |

### Tank Management — `/api/tanks`
| Route | Status | Notes |
|---|---|---|
| `GET /api/tanks` | ✅ | Lists all tanks |
| `GET /api/tanks/{id}` | ✅ | |
| `POST /api/tanks` | ✅ | |
| `PUT /api/tanks/{id}` | ✅ | |
| `DELETE /api/tanks/{id}` | ✅ | Guards against non-empty |
| `POST /api/tanks/transfer` | ✅ | Weighted avg recalculation |
| Tank `usagePercentage`, `stockValue`, `availableCapacity` in response | ❌ | **MISSING** — `TankResponse` DTO with derived fields not used; controller returns raw `Tank` entity |

### Transactions — `/api/transactions`
| Route | Status | Notes |
|---|---|---|
| `GET /api/transactions` | ✅ | Lists all |
| `GET /api/transactions/{id}` | ✅ | |
| `POST /api/transactions` | ✅ | With tank + bank side effects |
| `DELETE /api/transactions/{id}` | ✅ | |
| `GET /api/transactions/partners/report` | ❌ | **MISSING** — grouped partner summary not implemented |
| `GET /api/transactions/partners/{name}/balance` | ❌ | **MISSING** — net balance per partner not implemented |

### Production — `/api/production`
| Route | Status | Notes |
|---|---|---|
| `POST /api/production` | ✅ | Full 5-step atomic process |
| `GET /api/production/history` | ❌ | **MISSING** — endpoint returns nothing; no GET history route |

### Accounting — `/api/accounting`
| Route | Status | Notes |
|---|---|---|
| `GET /api/accounting/caisse` | ✅ (partial) | Returns caisse but `totalReceivables` / `totalPayables` are hardcoded to 0 |
| `GET /api/accounting/expenses` | ✅ | |
| `POST /api/accounting/expenses` | ✅ | |
| `DELETE /api/accounting/expenses/{id}` | ✅ | SUPER_ADMIN only |
| `GET /api/accounting/checks` | ✅ | |
| `GET /api/accounting/checks/urgent` | ✅ | |
| `POST /api/accounting/checks` | ✅ | |
| `PATCH /api/accounting/checks/{id}/status` | ✅ | |
| `DELETE /api/accounting/checks/{id}` | ✅ | |
| `GET /api/accounting/bank-accounts` | ✅ | |
| `POST /api/accounting/bank-accounts` | ✅ | |
| `PUT /api/accounting/bank-accounts/{id}` | ✅ | |
| `POST /api/accounting/cash/manual` | ❌ | **MISSING** — manual cash IN/OUT entry endpoint |
| `POST /api/accounting/cash/transfer-directeur` | ❌ | **MISSING** — usine → directeur cash transfer |
| `POST /api/accounting/cash/transfer-bank` | ❌ | **MISSING** — cash → bank account transfer |
| Receivables/Payables calculation | ❌ | **MISSING** — currently hardcoded to `0` in `CaisseResponse` |

### Vehicles — `/api/vehicles`
| Route | Status | Notes |
|---|---|---|
| `GET /api/vehicles` | ✅ | |
| `GET /api/vehicles/{id}` | ✅ | |
| `POST /api/vehicles` | ✅ | Duplicate plate check |
| `PUT /api/vehicles/{id}` | ✅ | |
| `DELETE /api/vehicles/{id}` | ✅ | |
| `POST /api/vehicles/{id}/load` | ✅ | Deducts factory stock, merges mobile stock |
| `GET /api/vehicles/{id}/mobile-stock` | ✅ | |
| `POST /api/vehicles/{id}/sale` | ✅ | Mobile sale with per-item transactions |
| `GET /api/vehicles/{id}/stats` | ✅ | |
| `PATCH /api/vehicles/{id}/mission` | ❌ | **MISSING** — mission start/end (destination, status update) not implemented |

### Seller Portal — `/api/seller`
| Route | Status | Notes |
|---|---|---|
| `GET /api/seller/my-stock` | ✅ | |
| `GET /api/seller/my-stats` | ✅ | |
| `POST /api/seller/sale` | ✅ | Scoped to JWT vehicleId |
| `POST /api/seller/cash-drop` | ✅ | Creates VERSEMENT transaction |
| `GET /api/seller/vehicle` | ❌ | **MISSING** — endpoint to get own vehicle info not implemented |
| `GET /api/seller/transactions` | ❌ | **MISSING** — own transaction history not implemented |

### HR & Timekeeping — `/api/hr`
| Route | Status | Notes |
|---|---|---|
| `GET /api/hr/employees` | ✅ | Active only |
| `POST /api/hr/employees` | ✅ | |
| `PUT /api/hr/employees/{id}` | ✅ | |
| `DELETE /api/hr/employees/{id}` | ✅ | Soft deactivate |
| `POST /api/hr/attendance` | ✅ | Upsert by employee+date |
| `GET /api/hr/attendance` | ✅ | By employeeId + date range |
| `PUT /api/hr/attendance/{id}` | ❌ | **MISSING** — API_ROUTES says `PUT /api/hr/attendance/{id}` but implementation uses `POST /api/hr/attendance` (upsert) — needs dedicated PUT route |
| `GET /api/hr/salaries/calculate` | ✅ | Calculates without saving |
| `POST /api/hr/salaries/pay` | ✅ | SUPER_ADMIN only, creates expense |
| `GET /api/hr/salaries` | ✅ | History, optionally by employeeId |
| `DELETE /api/hr/salary/{id}` | ❌ | **MISSING** — delete salary payment not implemented |

### Fuel Management — `/api/fuel`
| Route | Status | Notes |
|---|---|---|
| `GET /api/fuel` | ✅ | All logs |
| `GET /api/fuel/stats` | ✅ | Current stock + low-stock flag |
| `POST /api/fuel` | ✅ | Add log (ACHAT or CONSOMMATION) |
| `DELETE /api/fuel/{id}` | ✅ | |
| `POST /api/fuel/purchase` (dedicated) | ❌ | **MISSING** — API_ROUTES defines separate `POST /api/fuel/purchase` and `POST /api/fuel/consume` routes; current impl uses a single generic `POST /api/fuel` |
| `POST /api/fuel/consume` (dedicated) | ❌ | **MISSING** (same as above) |
| `GET /api/fuel/stock` | ❌ | **MISSING** — dedicated stock-only endpoint |

### Contracts — `/api/contracts`
| Route | Status | Notes |
|---|---|---|
| `GET /api/contracts` | ✅ | |
| `GET /api/contracts/{id}` | ✅ | |
| `POST /api/contracts` | ✅ | |
| `POST /api/contracts/allocate` | ✅ | Drains tank, updates progress, auto-terminates |
| `GET /api/contracts/{id}/stats` | ✅ | Profit, margin, weighted avg quality |
| `PATCH /api/contracts/{id}/status` | ✅ | |
| `DELETE /api/contracts/{id}` | ❌ | **MISSING** — delete contract (only if ANNULE) not implemented |

### Invoices — `/api/invoices`
| Route | Status | Notes |
|---|---|---|
| `GET /api/invoices` | ✅ | |
| `GET /api/invoices/{id}` | ✅ | |
| `POST /api/invoices` | ✅ | Auto-number, auto-totals, amountInWords |
| `DELETE /api/invoices/{id}` | ✅ | |
| `GET /api/invoices/{id}/pdf` | ✅ | Full iText 8 PDF with table, totals, TVA |
| `GET /api/invoices/next-number` | ❌ | **MISSING** — preview next invoice number |

### Email System — `/api/email`
| Route | Status | Notes |
|---|---|---|
| `GET /api/email/accounts` | ✅ | |
| `GET /api/email/accounts/{id}/folder/{folder}` | ✅ | |
| `GET /api/email/accounts/{id}/unread` | ✅ | Count only |
| `POST /api/email/send` | ✅ | Internal delivery if recipient is known |
| `PATCH /api/email/messages/{id}/read` | ✅ | |
| `DELETE /api/email/messages/{id}` | ✅ | Moves to TRASH |
| `POST /api/email/accounts` | ❌ | **MISSING** — create new internal email account |
| `PATCH /api/email/messages/{id}/trash` | ❌ | **MISSING** — dedicated trash endpoint (currently delete moves to trash, not a separate PATCH) |
| `GET /api/email/messages` (query params) | ❌ | **MISSING** — API_ROUTES uses `GET /api/email/messages?accountId=&folder=` but impl uses path: `/accounts/{id}/folder/{folder}` |

### Dashboard — `/api/dashboard`
| Route | Status | Notes |
|---|---|---|
| `GET /api/dashboard/summary` | ✅ | KPIs + weekly sales + alerts |
| `GET /api/dashboard/stats` | ❌ | **MISSING** — API_ROUTES defines a separate `/stats` endpoint; current impl bundles everything into `/summary` |
| `GET /api/dashboard/chart/weekly-sales` | ❌ | **MISSING** — separate chart endpoint not exposed |
| `GET /api/dashboard/alerts` | ❌ | **MISSING** — separate alerts endpoint (REST fallback before WS) not exposed |
| French day labels in weekly chart | ❌ | **MISSING** — current impl uses ISO date as label, not French day names (Lun, Mar, ...) |

### Activity Log — `/api/logs`
| Route | Status | Notes |
|---|---|---|
| `GET /api/logs` | ✅ | Paginated, newest first |
| `GET /api/logs/user/{username}` | ✅ | |

### Admin Panel — `/api/admin`
| Route | Status | Notes |
|---|---|---|
| `GET /api/admin/users` | ✅ | |
| `POST /api/admin/users/seller` | ✅ | Creates SELLER user linked to vehicleId |
| `POST /api/admin/users/block` | ✅ | Guards against SUPER_ADMIN |
| `POST /api/admin/users/unblock` | ✅ | |
| `DELETE /api/admin/users/{id}` | ❌ | **MISSING** — no user deletion endpoint |

---

## ❌ TODO — Missing Features & Gaps

### HIGH PRIORITY (Breaks Frontend Integration)

#### 1. `PATCH /api/stock/{id}/quantity` — Delta stock adjustment
- **Where:** `StockController.java` (add endpoint), `StockService.java` (already has `decreaseStock` but no generic delta method)
- **What:** Accept `{ "delta": Number }`, apply to quantity, reject if result < 0

#### 2. Tank response DTO with derived fields
- **Where:** `TankController.java` should map `Tank` → `TankResponse` with `usagePercentage`, `stockValue`, `availableCapacity`
- **What:** `TankResponse` DTO exists (`dto/response/TankResponse.java`) but is not used in the controller — the raw entity is returned instead
- ⚠️ **Check:** Verify `TankResponse.java` fields match the API spec

#### 3. `GET /api/production/history`
- **Where:** `ProductionController.java` (add GET endpoint), `ProductionService.java` (add `getHistory()`)
- **What:** Return all transactions where `type = PRODUCTION`

#### 4. Dashboard split endpoints
- **Where:** `DashboardController.java`
- **What:** Split current `/summary` into:
  - `GET /api/dashboard/stats` — KPIs only
  - `GET /api/dashboard/chart/weekly-sales` — weekly chart with French day labels
  - `GET /api/dashboard/alerts` — alerts snapshot (REST, before WS)
- **Note:** French day labels: use `DayOfWeek.getDisplayName(TextStyle.SHORT, Locale.FRENCH)`

#### 5. Accounting cash transfer endpoints
- **Where:** `AccountingController.java`, `AccountingService.java`
- **What:**
  - `POST /api/accounting/cash/manual` — generic IN/OUT `Expense` entry
  - `POST /api/accounting/cash/transfer-directeur` — creates 2 TRANSFERT expenses (negative usine, positive directeur)
  - `POST /api/accounting/cash/transfer-bank` — creates TRANSFERT expense + updates `BankAccount.balance`

#### 6. Receivables & Payables calculation
- **Where:** `AccountingService.java` → `getCaisse()`, `AccountingController.java` 
- **What:** 
  - `totalReceivables` = sum of `(priceTotal - amountPaid)` for VENTE transactions where `paymentStatus != PAYE`
  - `totalPayables` = sum of `(priceTotal - amountPaid)` for ACHAT transactions where `paymentStatus != PAYE`
  - Currently both are hardcoded to `0` in `AccountingController`

#### 7. `PATCH /api/vehicles/{id}/mission`
- **Where:** `VehicleController.java`, `VehicleService.java`
- **What:** Update `destination`, `loadType`, `loadQuantity`, `status` (EN_MISSION / DISPONIBLE)
- **Requires:** A `VehicleMissionRequest` DTO

#### 8. Seller portal missing routes
- **Where:** `SellerController.java`
- **What:**
  - `GET /api/seller/vehicle` — return own vehicle + mobileStock
  - `GET /api/seller/transactions` — return transactions where `vehicleId = JWT vehicleId`

#### 9. Fuel dedicated endpoints
- **Where:** `FuelController.java`, `FuelService.java`
- **What:** API_ROUTES defines:
  - `GET /api/fuel/stock` — stock-only endpoint (currently inside `/stats`)
  - `POST /api/fuel/purchase` — explicit ACHAT type log
  - `POST /api/fuel/consume` — explicit CONSOMMATION type log
- Current generic `POST /api/fuel` works but needs route aliases or dedicated endpoints matching API spec

#### 10. Contract delete endpoint
- **Where:** `ContractController.java`
- **What:** `DELETE /api/contracts/{id}` — only if `status == ANNULE`

#### 11. Partner report & balance routes
- **Where:** `TransactionController.java`, `TransactionService.java`, `TransactionRepository.java`
- **What:**
  - `GET /api/transactions/partners/report` — group by `partnerName`, compute `totalSales`, `totalPurchases`, `balance`, `transactionCount`, `lastTransactionDate`
  - `GET /api/transactions/partners/{partnerName}/balance` — single partner net balance

#### 12. `GET /api/invoices/next-number`
- **Where:** `InvoiceController.java`
- **What:** Preview next invoice number without creating one. Expose `InvoiceService.generateNumber()` as a GET endpoint.

#### 13. Email accounts creation + trash endpoint
- **Where:** `EmailController.java`, `EmailService.java`
- **What:**
  - `POST /api/email/accounts` — create a new internal email account
  - `PATCH /api/email/messages/{id}/trash` — dedicated trash-move endpoint
  - `GET /api/email/messages?accountId=&folder=` — query-param based route (in addition to or replacing path-based)

### MEDIUM PRIORITY (Functional gaps)

#### 14. HR `PUT /api/hr/attendance/{id}` 
- **Where:** `HRController.java`
- **What:** Dedicated update route by attendance record ID (separate from the POST upsert)

#### 15. HR `DELETE /api/hr/salary/{id}`
- **Where:** `HRController.java`, `HRService.java`
- **What:** Delete a salary payment record (SUPER_ADMIN only)

#### 16. Admin user deletion
- **Where:** `AdminController.java`, `AdminService.java`
- **What:** `DELETE /api/admin/users/{id}` or by username — remove a user entirely

### LOW PRIORITY (Polish / Correctness)

#### 17. `StockController` returns `201 Created` not `200 OK`
- **Where:** `StockController.java`, `VehicleController.java`, `HRController.java`, etc.
- **What:** Several POST endpoints return `200 OK` instead of `201 Created` as per API spec

#### 18. Accounting `GET /api/accounting/caisse` URL mismatch
- **Where:** `AccountingController.java`
- **What:** Controller exposes `/api/accounting/caisse` but API_ROUTES uses `/api/accounting/summary` — need to verify frontend is aligned or add alias

#### 19. `TankTransferRequest` field naming
- **Where:** `TankTransferRequest.java`, `TankController.java`
- **What:** API_ROUTES uses `fromTankId` / `toTankId`; verify request DTO field names match (current may use `sourceTankId` / `destTankId`)

#### 20. `LoadVehicleRequest` missing `pricePerUnit` per item
- **Where:** `LoadVehicleRequest.java`
- **What:** The load endpoint sets `pricePerUnit` on mobile stock items but verify it is included in the request DTO for each item

#### 21. `VehicleService.getSellerStats` — VERSEMENT filter
- **Where:** `VehicleService.java` (line ~146)
- **What:** Current query loads ALL VERSEMENT/ESPECE transactions and filters in memory — should filter by vehicleId at query level for correctness and performance

#### 22. Blocked user check in `JwtAuthFilter`
- **Where:** `JwtAuthFilter.java`
- **What:** Verify that when a user is blocked between JWT issuance and usage, the filter correctly rejects them (currently `UserDetailsServiceImpl` throws `LockedException` which is correct, but `GlobalExceptionHandler` may not map `LockedException` → 403 explicitly)

#### 23. Missing `LockedException` handler in `GlobalExceptionHandler`
- **Where:** `GlobalExceptionHandler.java`
- **What:** Add explicit handler for `org.springframework.security.authentication.LockedException` → HTTP 403

---

## 📋 Summary Table

| Module | API Routes Defined | Implemented | Missing |
|---|---|---|---|
| Auth | 3 | 3 | 0 |
| Stock | 4 | 3 | 1 |
| Tanks | 6 | 6 | 0 (but DTO gap) |
| Transactions | 5 | 3 | 2 |
| Production | 2 | 1 | 1 |
| Accounting | 13 | 10 | 3 |
| Vehicles | 8 | 7 | 1 |
| Seller Portal | 5 | 3 | 2 |
| HR | 8 | 6 | 2 |
| Fuel | 5 | 2 | 3 (semantic) |
| Contracts | 6 | 5 | 1 |
| Invoices | 5 | 4 | 1 |
| Email | 8 | 5 | 3 |
| Dashboard | 3 | 1 | 2 |
| Activity Log | 2 | 2 | 0 |
| Admin Panel | 4 | 4 | 0 (1 optional) |
| **TOTAL** | **87** | **65** | **22** |

---

## 🔧 Implementation Priority Queue

```
1. [HIGH] Dashboard split endpoints + French labels         → DashboardController + DashboardService
2. [HIGH] Tank response DTO (derived fields)                → TankController mapping  
3. [HIGH] Accounting receivables/payables + cash transfers  → AccountingService + AccountingController
4. [HIGH] Partner report & balance                          → TransactionController + TransactionService
5. [HIGH] PATCH /api/stock/{id}/quantity                    → StockController + StockService
6. [HIGH] GET /api/production/history                       → ProductionController + ProductionService
7. [HIGH] PATCH /api/vehicles/{id}/mission                  → VehicleController + VehicleService
8. [HIGH] Seller portal missing routes                      → SellerController
9. [HIGH] Fuel dedicated endpoints                          → FuelController
10. [HIGH] DELETE /api/contracts/{id} (ANNULE only)         → ContractController + ContractService
11. [HIGH] GET /api/invoices/next-number                    → InvoiceController
12. [HIGH] Email accounts POST + trash PATCH                → EmailController + EmailService
13. [MEDIUM] HR attendance PUT + salary DELETE              → HRController + HRService
14. [MEDIUM] LockedException handler                        → GlobalExceptionHandler
15. [LOW] 201 Created on POST endpoints                     → Multiple controllers
16. [LOW] VehicleService VERSEMENT filter at DB level       → VehicleService + TransactionRepository
17. [LOW] TankTransferRequest field naming alignment        → TankTransferRequest DTO
```

---

## 🗄️ Database

- **Engine:** PostgreSQL (configured in `application.properties`)
- **DDL:** `spring.jpa.hibernate.ddl-auto=update` — schema auto-managed by Hibernate
- **Seed:** `DataInitializer` runs on first boot — idempotent (skips if users already exist)

---

## 🔑 Default Credentials (seeded)

| Username | Password | Role |
|---|---|---|
| `mojo` | `hamoda2004` | SUPER_ADMIN |
| `boss` | `hamoda2004` | SUPER_ADMIN |
| `hajar` | `hajar2004` | ADMIN |
| `safae` | `zitlblad2004` | ADMIN |

> ⚠️ **Change all passwords before production deployment.**

---

## 📦 Dependencies Used

| Library | Version | Purpose |
|---|---|---|
| Spring Boot | 4.0.3 | Core framework |
| Spring Security | (managed) | Auth + JWT filter |
| Spring Data JPA | (managed) | ORM + repositories |
| Spring WebSocket | (managed) | Native WS for alerts |
| Spring Validation | (managed) | `@Valid` on DTOs |
| PostgreSQL JDBC | (managed) | DB driver |
| jjwt-api/impl/jackson | 0.12.6 | JWT generation + parsing |
| iTextPDF (kernel + layout) | 8.0.5 | PDF invoice generation |
| Lombok | (managed) | Boilerplate reduction |
| SpringDoc OpenAPI | 3.0.1 | Swagger UI at `/swagger-ui.html` |

---

## 🚀 Running the Project

```bash
# Prerequisites: PostgreSQL running, database 'olivepro' created
cd backend
./mvnw spring-boot:run
```

> Make sure to update `application.properties` with the correct PostgreSQL password and a strong JWT secret (at least 32 characters).

---

