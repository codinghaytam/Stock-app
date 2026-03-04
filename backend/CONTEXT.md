# OlivePro — Backend Application Context

> **Version:** 1.0  
> **Stack:** Java 21 + Spring Boot 4 + Spring Security (JWT) + JPA/Hibernate + PostgreSQL  
> **Purpose:** Factory management system for an olive oil production company in Morocco (currency: MAD, French UI labels)

---

## 1. System Overview

OlivePro is a **full-stack factory management system** for an olive-oil production and distribution company. It manages the entire lifecycle:

```
Olive Harvest → Production → Oil Tanks → Contracts / Invoices → Distribution (Mobile Trucks) → Accounting
```

The backend exposes a **RESTful JSON API** consumed by a React/TypeScript frontend. All business logic that currently lives in the React state will be moved to backend services. The frontend will be a thin UI layer that only calls the API and renders responses.

---

## 2. Authentication & User Roles

### User Types

| Username | Role | Password | Access Level |
|---|---|---|---|
| `mojo` | `SUPER_ADMIN` | `hamoda2004` | Full access to everything |
| `boss` | `SUPER_ADMIN` | `hamoda2004` | Full access to everything |
| `hajar` | `ADMIN` | `hajar2004` | All modules EXCEPT financial data (Accounting, Salaries) |
| `safae` | `ADMIN` | `zitlblad2004` | All modules EXCEPT financial data |
| `<plateNumber>` | `SELLER` | `ZITLBLAD2004` | Only their own SellerDashboard (mobile sales, cash drop) |

> **Note:** Passwords must be stored as BCrypt hashes in the DB. These are the initial seed values.

### JWT Flow
1. `POST /api/auth/login` → returns `{ token, role, username, vehicleId? }`
2. All subsequent requests include `Authorization: Bearer <token>`
3. Token expiry: 24 hours (configurable)
4. Blocked users cannot log in even with a valid token — always check `User.isBlocked` on every protected request via a filter

### Role-Based Access Control

- `SUPER_ADMIN`: all endpoints
- `ADMIN` (`hajar`, `safae`): all endpoints except `/api/accounting/**`, `/api/hr/salaries/**`, `/api/admin/**`
- `SELLER`: only `/api/seller/**` endpoints (scoped to their own vehicle by vehicleId extracted from JWT)

### Blocking
- A `SUPER_ADMIN` can block/unblock any user except other `SUPER_ADMIN`s
- Blocked users get `403 Forbidden` at login AND at every request (checked via `SecurityFilter`)

---

## 3. Core Domain Modules

### 3.1 Stock Management

**Entities:** `StockItem`, `Tank`

#### StockItem
Represents physical inventory:
- Types: `OLIVE`, `NOYAUX` (olive pits), `HUILE_VRAC` (bulk oil), `HUILE_BOUTEILLE` (bottled oil), `GRIGNONS` (olive pomace), `FITOUR`
- Only `HUILE_BOUTEILLE` items have a `brand` and `bottleSize` (1L, 1/2L, 2L, 5L)
- When adding a stock item that already exists (same name+type+brand+bottleSize), **quantities are merged** (not duplicated)
- Units: `kg`, `L`, or `unités`

#### Tank (Citerne)
Tanks hold bulk olive oil (`HUILE_VRAC`):
- Each tank has: `capacity` (L), `currentLevel` (L), `acidity` (%), `waxes` (mg/kg), `avgCost` (MAD/L)
- **Weighted Average Calculation** (CRITICAL business logic):
  - On every purchase or production fill:
    ```
    newAcidity = ((currentLevel * currentAcidity) + (addedQty * addedAcidity)) / newLevel
    newWaxes   = ((currentLevel * currentWaxes)   + (addedQty * addedWaxes))   / newLevel
    newAvgCost = ((currentLevel * avgCost)         + (addedQty * unitCost))     / newLevel
    ```
  - On sale: level decreases, quality metrics do NOT change
  - When tank empties (level = 0): reset acidity=0, waxes=0, avgCost=0
- Status auto-updates: `EMPTY` (level=0), `FILLING` (0 < level < capacity), `FULL` (level >= capacity), `MAINTENANCE` (manual)
- **Oil Transfer** between tanks: deduct from source, add to destination with weighted average recalculation

---

### 3.2 Transaction Management

**Entity:** `Transaction`, `TankDistribution`

A `Transaction` records any movement of goods or money:

| Type | Description |
|---|---|
| `ACHAT` | Purchase of olives or bulk oil from a supplier |
| `VENTE` | Sale of bulk oil or bottled oil to a client |
| `PRODUCTION` | Oil produced from olives (internal) |
| `CHARGEMENT_CAMION` | Loading bottles onto a company vehicle |
| `VERSEMENT` | Seller deposits cash collected back to the factory |

**Key fields:**
- `priceTotal` always stored in **MAD**
- `originalAmount` + `currency` + `exchangeRate` for multi-currency tracking (EUR, USD, MAD)
- `partnerName`: client or supplier name
- `vehicleId` (optional): linked internal vehicle
- `tankId` / `tankDistributions`: for `HUILE_VRAC` transactions, oil is allocated to one or more tanks (multi-tank distribution)
- `paymentMethod`: `ESPECE`, `CAISSE_DIRECTEUR`, `CHEQUE`, `VIREMENT`, `CREDIT`, `TIERS`
- `paymentStatus`: `PAYE`, `PARTIEL`, `IMPAYE`
- `amountPaid`: partial payment tracking

**Side effects on transaction creation:**
1. If `productType = HUILE_VRAC` → update tank levels (and quality metrics if ACHAT/PRODUCTION)
2. If `paymentMethod = VIREMENT` and `bankAccountId` is set → update `BankAccount.balance`
3. Always log to `ActivityLog`

---

### 3.3 Production Management

**Business Process:** Olives → Crushing → Oil + Waste

When a production run is recorded:
1. Deduct input raw material (`OLIVE` or `NOYAUX`) from `StockItem` by `inputQuantity`
2. Add `outputOilQty` of bulk oil to the target tank (with weighted average recalculation)
3. Add by-products to stock:
   - `GRIGNONS` (olive pomace) → `StockItem` of type `GRIGNONS`
   - `FITOUR` → `StockItem` of type `FITOUR`
   - If a by-product stock item already exists, merge quantity
4. Create a `Transaction` of type `PRODUCTION` for history
5. Log to `ActivityLog`

---

### 3.4 Accounting

**Entities:** `Expense`, `BankCheck`, `BankAccount`

#### Cash Flow Model (Two-Caisse System)
The company operates **two separate cash registers**:
- **Caisse Usine (Main):** tracks all `ESPECE` (cash) flows from transactions + expenses
- **Caisse Directeur:** tracks all `CAISSE_DIRECTEUR` payment method flows

Both caisses are **derived/calculated** from transactions and expenses — they are NOT stored as separate balance fields. Recalculate on every request.

**Caisse Usine = Σ(ESPECE sales amountPaid) - Σ(ESPECE purchases amountPaid) - Σ(ESPECE expenses) + Σ(ESPECE salary payments) (inverted) + Σ(VERSEMENT amounts)**

**Caisse Directeur = Σ(CAISSE_DIRECTEUR income) - Σ(CAISSE_DIRECTEUR expenses)**

#### Expense
- Categories: `ELECTRICITE`, `CARBURANT`, `MAINTENANCE`, `SALAIRES`, `TRANSFERT`, `AUTRE`
- A negative `amount` represents income (manual cash entry)
- `paymentMethod` determines which caisse is impacted

#### BankCheck (Chèque)
- Direction: `RECU` (from client) or `EMIS` (to supplier)
- Status lifecycle: `EN_COFFRE` → `DEPOSE` → `ENCAISSE` or `REJETE`
- Urgent checks = those with `EN_COFFRE` status due within 3 days

#### BankAccount
- Multiple bank accounts supported (CIH, BMCE, etc.)
- Multi-currency: balance stored in account's native currency
- Transfers to/from main caisse are tracked via `TRANSFERT` expenses

#### Net Profit Calculation
```
Net Profit = Total Sales Revenue - Total Purchase Cost - Total Expenses (positive amounts)
```

---

### 3.5 Vehicle & Mobile Sales Management

**Entities:** `Vehicle`, `MobileStockItem`

#### Vehicle
- Types: `CAMION`, `CAMIONNETTE`, `UTILITAIRE`
- Statuses: `DISPONIBLE`, `EN_MISSION`, `MAINTENANCE`
- Each vehicle carries its own `mobileStock` (list of bottled products loaded on the truck)

#### Load Vehicle (Admin operation)
1. Admin selects a vehicle + items to load from factory stock
2. Factory `StockItem` quantities are decreased
3. Vehicle `mobileStock` is increased (merge by brand+bottleSize if already exists)
4. Creates a `CHARGEMENT_CAMION` transaction for history

#### Mobile Sale (by Seller or Admin)
1. Seller selects items from their truck's mobile stock
2. Creates one `Transaction` per cart item (type = `VENTE`, productType = `HUILE_BOUTEILLE`)
3. Decreases vehicle `mobileStock`
4. Payment is split proportionally across items when `PARTIEL`
5. GPS location optionally recorded

#### Seller Dashboard (restricted access)
- Seller logs in with their vehicle plate number as username
- They can only see their own vehicle's data
- **Seller Stats** (calculated):
  - `totalSales`: sum of all their sale transactions
  - `totalCashCollected`: sum of ESPECE amountPaid
  - `totalCreditGiven`: sum of IMPAYE transactions
  - `totalDeposited`: sum of VERSEMENT transactions (cash they gave back to factory)
  - `netCashInHand`: totalCashCollected - totalDeposited

#### Cash Drop (Versement)
When a seller deposits money back to the factory:
1. Creates a `VERSEMENT` transaction
2. Creates a negative `Expense` (income entry) in the main caisse
3. Logs the action

---

### 3.6 Human Resources & Timekeeping

**Entities:** `Employee`, `AttendanceRecord`, `SalaryPayment`

#### Employee Types
| Role | Salary Logic |
|---|---|
| `OUVRIER` (Worker) | Daily rate (baseSalary per day present) |
| `EMPLOYE` (Employee) | Monthly fixed salary |

#### Attendance Status & Day Coefficient
| Status | Coefficient |
|---|---|
| `PRESENT` | 1.0 (full day) |
| `MATIN` | 0.5 (half morning) |
| `APRES_MIDI` | 0.5 (half afternoon) |
| `CONGE` | 1.0 (paid leave) |
| `ABSENT` | 0.0 |

Overtime hours are added on top at the normal rate.

#### Salary Calculation
- **Weekly (Ouvrier):** `Σ(days × baseSalary × dayCoefficient) + Σ(overtimeHours × hourlyRate)`
  - Hourly rate = baseSalary / 8
- **Monthly (Employe):** `baseSalary` (fixed, check absences if any deduction policy applies)

#### Salary Payment
- When a salary is paid in ESPECE: creates an `Expense` of category `SALAIRES`
- When paid by VIREMENT: decrements the chosen `BankAccount.balance`
- When `IMPAYE`: no financial movement (recorded as debt only)
- Advances (`advanceAmount` on attendance) are tracked but deducted separately

---

### 3.7 Fuel Management

**Entity:** `FuelLog`

The factory maintains a central fuel depot:
- `currentStock` = **derived** from all `ACHAT` - `CONSOMMATION` fuel logs (not a stored field)
- **Purchase:** adds to stock, creates a `CARBURANT` expense
- **Consumption:** deducts from stock, linked to a `Vehicle` (saves plateNumber for history)
- Low stock alert threshold: < 500L
- Cost per liter = cost / quantity (from purchase logs)

---

### 3.8 Contract Management

**Entities:** `Contract`, `ContractAllocation`

A contract is an agreement to sell a specific quantity of oil to a client:
- `targetQuantity`, `targetAcidity` (max), `targetWaxes` (max)
- `priceSell` per liter

#### Allocation
When oil is allocated from a tank to a contract:
1. Tank's `currentLevel` is reduced
2. A `ContractAllocation` record is created with source tank metrics
3. Contract progress is recalculated: `progressPercentage = (totalAllocated / targetQuantity) * 100`
4. If `totalAllocated >= targetQuantity` → contract status auto-updates to `TERMINE`

#### Contract Stats (calculated, not stored)
- `avgAcidity` = weighted average of all allocations
- `avgWaxes` = weighted average of all allocations
- `totalCost` = Σ(allocation.quantity × allocation.costPrice)
- `totalRevenue` = totalAllocated × priceSell
- `profit` = totalRevenue - totalCost
- `profitMargin` = (profit / totalRevenue) × 100

---

### 3.9 Invoice Management

**Entities:** `Invoice`, `InvoiceItem`

Standard commercial invoice:
- Auto-generated number format: `<sequential_number>/<2-digit_year>` (e.g., `76/25`)
- TVA (VAT) rate configurable per invoice (default 20%)
- `totalHT` = Σ(item.quantity × item.unitPrice)
- `tvaAmount` = totalHT × tvaRate
- `totalTTC` = totalHT + tvaAmount
- `amountInWords` = **generated server-side** by the backend using `NumberToWordsFr` (French text representation). This value is authoritative and returned on invoice create/read responses; it is not expected to be manually typed on the frontend.
- PDF generation: **server-side only** (iText/OpenPDF). The backend exposes `GET /api/invoices/{id}/pdf` which returns a content-type `application/pdf` and the raw PDF bytes.

> Note: The frontend no longer generates invoices as PDFs client-side; it calls the server PDF endpoint to download a printable invoice.

---

### 3.10 Email System

**Entities:** `EmailAccount`, `EmailMessage`

Internal company email system (NOT connected to external SMTP — purely internal):
- Multiple accounts represent departments (Direction Générale, Commercial, RH, Logistique)
- Sending to an internal address → creates an inbox copy for the recipient account
- Sending to an external address → only saved in sender's `SENT` folder
- Folders: `INBOX`, `SENT`, `TRASH`
- Unread count drives the notification badge in the sidebar

---

### 3.11 Activity Log

**Entity:** `ActivityLog`

Every significant action in the system is logged:
- `username`: who performed the action
- `action`: category (e.g., "Transaction", "Production", "Admin")
- `details`: human-readable description
- `financialAmount` (optional): monetary value of the action

Logs are append-only. No deletion from the API.

---

### 3.12 Dashboard

Aggregated statistics (all derived, nothing stored):
- `totalSales`: sum of all VENTE transaction priceTotals
- `netProfit`: as defined in §3.4
- `totalOilVolume`: sum of all tank currentLevels
- `totalOilCapacity`: sum of all tank capacities
- `capacityUtilizationPercent`: (totalOilVolume / totalOilCapacity) × 100
- `totalTransactionCount`: count of all transactions
- Weekly sales chart: last 7 days, grouped by day
- System alerts: unread emails, urgent checks, low fuel, low tanks

---

### 3.13 Real-Time Alerts (WebSocket)

OlivePro supports real-time alerts pushed from the backend to connected frontend clients using a native WebSocket endpoint. This is used to update the sidebar alert badges (unread emails, urgent checks, low fuel, low tanks) without polling.

- WebSocket endpoint (native): `ws://<host>:<port>/ws/alerts?token=<JWT>`
  - The client MUST include a valid JWT in the `token` query parameter on the upgrade handshake. The server validates the token and rejects the connection if invalid or if the user is blocked.
  - Once connected, the server will send JSON payloads of the following shape when relevant events occur:
    ```json
    {
      "unreadEmails": 3,
      "urgentChecks": 1,
      "lowFuel": 0,
      "lowTankCount": 2
    }
    ```
- Triggering events (services should call the `AlertsBroadcaster` after mutation):
  - Email received or message marked read/unread (EmailService)
  - Bank check added/updated (AccountingService)
  - Fuel purchase or consumption (FuelService)
  - Tank level change (TankService) — ACHAT, PRODUCTION, TRANSFER, or manual adjustments
- The REST endpoint `GET /api/dashboard/alerts` remains available for an initial snapshot during page load; real-time updates will be delivered over the WebSocket after the client connects.

---

## 4. Data Integrity & Business Rules

| Rule | Description |
|---|---|
| Stock cannot go negative | `StockItem.quantity` must never go below 0. Return 400 if insufficient stock |
| Tank cannot exceed capacity | Cap at `capacity` and return 400 if overflow attempted |
| Tank cannot go below 0 | Cap at 0 |
| Blocked user | Return 403 at every request, not just login |
| Super Admin is unblockable | `mojo` and `boss` cannot be blocked via API |
| Seller scope | Sellers can only access their own vehicle's data — enforce via JWT vehicleId claim |
| Invoice number uniqueness | Sequential, no gaps — use a DB sequence or last-number lookup |
| Weighted averages | Must be recalculated on every fill operation, never stored incorrectly |
| Transaction immutability | Transactions should not be editable, only deletable (by ADMIN+) |

---

## 5. Initial Data Seeds

The following data should be pre-seeded in the database on first run:

**Users:**
- `mojo` / `hamoda2004` / `SUPER_ADMIN`
- `boss` / `hamoda2004` / `SUPER_ADMIN`
- `hajar` / `hajar2004` / `ADMIN`
- `safae` / `zitlblad2004` / `ADMIN`

**Email Accounts:**
- `direction@marrakech-agro.com` — Direction Générale
- `commercial@marrakech-agro.com` — Service Commercial
- `rh@marrakech-agro.com` — Ressources Humaines
- `logistique@marrakech-agro.com` — Logistique & Transport

**Welcome Email:** Send a system welcome message to `direction@marrakech-agro.com` inbox on first run.

---

## 6. Technology Decisions

| Concern | Decision |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 4 |
| Security | Spring Security + JWT (jjwt or auth0 java-jwt) |
| Build | Maven |
| ORM | Spring Data JPA + Hibernate |
| Database | PostgreSQL (production), H2 (tests) |
| PDF Generation | iText 7 or OpenPDF (server side) |
| Real-time push | Spring WebSocket (native WebSocket handler) — lightweight native WebSocket endpoint at `/ws/alerts` |
| Validation | Jakarta Bean Validation (`@Valid`, `@NotBlank`, etc.) |
| Error Handling | `@RestControllerAdvice` global handler |
| CORS | Allow frontend origin (configurable via `application.properties`) |
| Logging | SLF4J + Logback |

---

## 7. Package Structure (suggested)

```
com.olivepro
├── config/          # SecurityConfig, JwtConfig, CorsConfig, DataInitializer
├── controller/      # REST Controllers (one per module)
├── service/         # Business logic services
├── repository/      # Spring Data JPA Repositories
├── domain/          # JPA Entities
├── dto/             # Request/Response DTOs
├── enums/           # All enum types
├── exception/       # Custom exceptions + GlobalExceptionHandler
├── security/        # JwtUtil, JwtAuthFilter, UserDetailsServiceImpl
└── util/            # NumberToWords (French), WeightedAverageCalculator, etc.
```
