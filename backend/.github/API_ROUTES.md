# OlivePro API Routes Reference

> **Base URL:** `http://localhost:8080/api`  
> **Auth:** All routes except `/auth/login` require `Authorization: Bearer <JWT>`  
> **Content-Type:** `application/json`

---

## Legend

| Symbol | Meaning |
|---|---|
| 🔓 | Public (no token required) |
| 👑 | `SUPER_ADMIN` only |
| 🛡️ | `SUPER_ADMIN` + `ADMIN` |
| 👁️ | `SUPER_ADMIN` + restricted `ADMIN` (no financials for hajar/safae) |
| 🚚 | `SELLER` only (scoped to own vehicle via JWT) |
| 🛡️+🚚 | `SUPER_ADMIN`, `ADMIN`, and `SELLER` |

---

## 1. Authentication — `/api/auth`

### `POST /api/auth/login` 🔓
Login and receive a JWT token.

**Request Body:**
```json
{
  "username": "mojo",
  "password": "hamoda2004"
}
```

**Response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "username": "mojo",
  "role": "SUPER_ADMIN",
  "vehicleId": null
}
```
> For a seller login, `vehicleId` will be populated with the vehicle's DB ID.  
> Returns `401` if credentials are wrong.  
> Returns `403` if user is blocked.

---

### `POST /api/auth/logout` 🛡️+🚚
Invalidate current session (server-side token blacklist or client-side only).

**Response `200 OK`:**
```json
{ "message": "Logged out successfully" }
```

---

### `GET /api/auth/me` 🛡️+🚚
Returns the currently authenticated user's profile.

**Response `200 OK`:**
```json
{
  "id": 1,
  "username": "mojo",
  "role": "SUPER_ADMIN",
  "isBlocked": false,
  "lastLogin": "2026-02-24T09:00:00"
}
```

---

## 2. Stock Management — `/api/stock`

### `GET /api/stock` 🛡️
Get all stock items.

**Query Params (optional):** `type` (ProductType), `page`, `size`

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "name": "ZITLBLAD 1L",
    "type": "HUILE_BOUTEILLE",
    "quantity": 240,
    "unit": "unités",
    "brand": "ZITLBLAD",
    "bottleSize": "1L"
  }
]
```

---

### `POST /api/stock` 🛡️
Add a new stock item or merge quantity into an existing one (same name + type + brand + bottleSize).

**Request Body:**
```json
{
  "name": "ZITLBLAD 1L",
  "type": "HUILE_BOUTEILLE",
  "quantity": 100,
  "unit": "unités",
  "brand": "ZITLBLAD",
  "bottleSize": "1L"
}
```

**Response `201 Created`:** returns the created or updated `StockItem`

---

### `PATCH /api/stock/{id}/quantity` 🛡️
Adjust stock quantity (positive = add, negative = remove).

**Request Body:**
```json
{ "delta": -20 }
```

**Response `200 OK`:** updated `StockItem`  
**Returns `400`** if resulting quantity would be negative.

---

### `DELETE /api/stock/{id}` 🛡️
Delete a stock item.

**Response `204 No Content`**

---

## 3. Tank Management — `/api/tanks`

### `GET /api/tanks` 🛡️
Get all tanks with current levels, quality metrics, and calculated stats.

**Response `200 OK`:**
```json
[
  {
    "id": 1,
    "name": "Citerne 1",
    "capacity": 10000,
    "currentLevel": 6500,
    "acidity": 0.82,
    "waxes": 148,
    "avgCost": 12.50,
    "status": "FILLING",
    "usagePercentage": 65.0,
    "stockValue": 81250.0,
    "availableCapacity": 3500.0
  }
]
```

---

### `POST /api/tanks` 🛡️
Create a new tank.

**Request Body:**
```json
{
  "name": "Citerne 3",
  "capacity": 15000
}
```

**Response `201 Created`:** created `Tank`

---

### `PUT /api/tanks/{id}` 🛡️
Update tank metadata (name, capacity, status for maintenance).

**Request Body:** same as POST  
**Response `200 OK`:** updated `Tank`

---

### `DELETE /api/tanks/{id}` 🛡️
Delete a tank (only if empty).

**Response `204 No Content`**  
**Returns `400`** if tank has oil in it.

---

### `POST /api/tanks/transfer` 🛡️
Transfer oil between two tanks with automatic weighted average recalculation.

**Request Body:**
```json
{
  "fromTankId": 1,
  "toTankId": 2,
  "quantity": 500.0
}
```

**Response `200 OK`:**
```json
{
  "fromTank": { ...updated tank... },
  "toTank": { ...updated tank... }
}
```
**Returns `400`** if source has insufficient oil.

---

## 4. Transactions — `/api/transactions`

### `GET /api/transactions` 🛡️
Get all transactions.

**Query Params (optional):** `type` (TransactionType), `partner` (String), `startDate` (YYYY-MM-DD), `endDate` (YYYY-MM-DD), `page`, `size`

**Response `200 OK`:** paginated list of transactions

---

### `POST /api/transactions` 🛡️
Create a new transaction. Side effects are handled server-side:
- Updates tank levels (and quality metrics) if `HUILE_VRAC`
- Updates bank account balance if `paymentMethod = VIREMENT`
- Logs to `ActivityLog`

**Request Body:**
```json
{
  "type": "ACHAT",
  "productType": "HUILE_VRAC",
  "quantity": 2000.0,
  "unit": "L",
  "priceTotal": 28000.0,
  "originalAmount": 28000.0,
  "currency": "MAD",
  "exchangeRate": 1.0,
  "partnerName": "Fournisseur Ben Ali",
  "acidity": 0.8,
  "waxes": 150,
  "paymentMethod": "ESPECE",
  "paymentStatus": "PAYE",
  "amountPaid": 28000.0,
  "tankDistributions": [
    { "tankId": 1, "quantity": 1200.0 },
    { "tankId": 2, "quantity": 800.0 }
  ]
}
```

**Response `201 Created`:** created `Transaction`

---

### `DELETE /api/transactions/{id}` 🛡️
Delete a transaction (does NOT reverse tank/bank effects — manual adjustment required).

**Response `204 No Content`**

---

### `GET /api/transactions/partners/report` 🛡️
Get a summary report grouped by partner (client/supplier).

**Response `200 OK`:**
```json
[
  {
    "partnerName": "Client Dupont",
    "type": "CLIENT",
    "totalSales": 120000.0,
    "totalPurchases": 0.0,
    "balance": -120000.0,
    "transactionCount": 8,
    "lastTransactionDate": "2026-02-20T14:30:00"
  }
]
```

---

### `GET /api/transactions/partners/{partnerName}/balance` 🛡️
Get the net balance for a specific partner (positive = they owe us, negative = we owe them).

**Response `200 OK`:**
```json
{ "partnerName": "Client Dupont", "balance": 15000.0 }
```

---

## 5. Production — `/api/production`

### `POST /api/production` 🛡️
Record a production run (olives → oil + waste).

**Request Body:**
```json
{
  "inputStockId": 3,
  "inputQuantity": 5000.0,
  "outputTankId": 1,
  "outputOilQty": 950.0,
  "acidity": 0.75,
  "waxes": 140,
  "grignonsQty": 3200.0,
  "fitourQty": 850.0
}
```

**Response `201 Created`:** the created `Transaction` (type = PRODUCTION) + updated tank summary

**Side effects (all atomic in one @Transactional):**
1. Deduct `inputQuantity` from `StockItem[inputStockId]`
2. Add `outputOilQty` to `Tank[outputTankId]` with weighted avg recalculation
3. Add/merge `grignonsQty` to GRIGNONS stock
4. Add/merge `fitourQty` to FITOUR stock
5. Create PRODUCTION Transaction
6. Log to ActivityLog

---

### `GET /api/production/history` 🛡️
Get all PRODUCTION type transactions.

**Response `200 OK`:** list of transactions

---

## 6. Accounting — `/api/accounting`

> ⚠️ All `/api/accounting/**` routes require `SUPER_ADMIN` role (blocked for hajar/safae)

### `GET /api/accounting/summary` 👑+🛡️(financial admins only)
Get full accounting overview.

**Response `200 OK`:**
```json
{
  "caisseUsine": 45200.0,
  "caisseDirecteur": 18500.0,
  "totalReceivables": 32000.0,
  "totalPayables": 8000.0,
  "netProfit": 156000.0,
  "totalBankBalance": 280000.0
}
```

---

### `GET /api/accounting/expenses` 👑
Get all expenses.

**Query Params:** `category`, `startDate`, `endDate`, `page`, `size`

**Response `200 OK`:** list of expenses

---

### `POST /api/accounting/expenses` 👑
Add a new expense.

**Request Body:**
```json
{
  "category": "ELECTRICITE",
  "description": "Facture ONEE Février",
  "amount": 3200.0,
  "paymentMethod": "ESPECE",
  "date": "2026-02-15"
}
```

**Response `201 Created`:** created `Expense`

---

### `DELETE /api/accounting/expenses/{id}` 👑
Delete an expense.

**Response `204 No Content`**

---

### `POST /api/accounting/cash/manual` 👑
Record a manual cash adjustment (income or outgo).

**Request Body:**
```json
{
  "amount": 500.0,
  "description": "Divers encaissement",
  "type": "IN"
}
```

**Response `201 Created`:** created `Expense` entry

---

### `POST /api/accounting/cash/transfer-directeur` 👑
Transfer cash from Caisse Usine to Caisse Directeur.

**Request Body:**
```json
{ "amount": 10000.0 }
```

**Response `200 OK`:** updated caisse summary

---

### `POST /api/accounting/cash/transfer-bank` 👑
Transfer cash to a bank account.

**Request Body:**
```json
{
  "bankAccountId": 2,
  "amount": 25000.0
}
```

**Response `200 OK`:** updated bank account

---

### `GET /api/accounting/checks` 👑
Get all bank checks.

**Query Params:** `direction` (RECU/EMIS), `status`

**Response `200 OK`:** list of `BankCheck`

---

### `POST /api/accounting/checks` 👑
Add a bank check.

**Request Body:**
```json
{
  "number": "CHQ-0042",
  "bank": "CIH",
  "amount": 15000.0,
  "dueDate": "2026-03-15",
  "direction": "RECU",
  "partnerName": "Client Samir"
}
```

**Response `201 Created`:** created `BankCheck`

---

### `PATCH /api/accounting/checks/{id}/status` 👑
Update check status (EN_COFFRE → DEPOSE → ENCAISSE or REJETE).

**Request Body:**
```json
{ "status": "ENCAISSE" }
```

**Response `200 OK`:** updated `BankCheck`

---

### `DELETE /api/accounting/checks/{id}` 👑
Delete a check.

**Response `204 No Content`**

---

### `GET /api/accounting/checks/urgent` 👑
Get checks that are due within 3 days or overdue (status = EN_COFFRE only).

**Response `200 OK`:** list of urgent `BankCheck`

---

### `GET /api/accounting/bank-accounts` 👑
Get all bank accounts.

**Response `200 OK`:** list of `BankAccount`

---

### `POST /api/accounting/bank-accounts` 👑
Add a bank account.

**Request Body:**
```json
{
  "bankName": "CIH",
  "accountNumber": "007123456789",
  "currency": "MAD",
  "balance": 0.0
}
```

**Response `201 Created`:** created `BankAccount`

---

### `PUT /api/accounting/bank-accounts/{id}` 👑
Update bank account (balance correction, etc.).

**Response `200 OK`:** updated `BankAccount`

---

## 7. Vehicles — `/api/vehicles`

### `GET /api/vehicles` 🛡️
Get all vehicles with their mobile stock.

**Response `200 OK`:** list of `Vehicle` with nested `mobileStock`

---

### `POST /api/vehicles` 🛡️
Add a new vehicle.

**Request Body:**
```json
{
  "plateNumber": "45678-A-2",
  "driverName": "Hassan Idrissi",
  "type": "CAMION"
}
```

**Response `201 Created`:** created `Vehicle`

---

### `PATCH /api/vehicles/{id}/mission` 🛡️
Update vehicle mission (start/end).

**Request Body:**
```json
{
  "destination": "Marrakech Centre",
  "loadType": "Huile Bouteille",
  "loadQuantity": 200.0,
  "status": "EN_MISSION"
}
```

**Response `200 OK`:** updated `Vehicle`

---

### `POST /api/vehicles/{id}/load` 🛡️
Load factory stock items into a vehicle's mobile stock. Decrements factory stock.

**Request Body:**
```json
{
  "items": [
    { "stockItemId": 5, "quantity": 48 },
    { "stockItemId": 6, "quantity": 24 }
  ]
}
```

**Response `200 OK`:** updated `Vehicle` with new `mobileStock`  
**Returns `400`** if factory stock is insufficient.

---

### `POST /api/vehicles/{id}/mobile-sale` 🛡️
Record a sale from a vehicle's mobile stock (admin-side).

**Request Body:** (see MobileSaleRequest in CONTEXT.md)
```json
{
  "clientName": "Épicerie Al Waha",
  "gpsLocation": "31.6295,-7.9811",
  "paymentMethod": "ESPECE",
  "paymentStatus": "PAYE",
  "amountPaid": 720.0,
  "items": [
    { "brand": "ZITLBLAD", "bottleSize": "1L", "quantity": 12, "price": 60.0 },
    { "brand": "ASSLIA",   "bottleSize": "2L", "quantity": 6,  "price": 100.0 }
  ]
}
```

**Response `201 Created`:** list of created `Transaction`s

---

### `GET /api/vehicles/{id}/stats` 🛡️
Get seller stats for a vehicle (total sales, cash collected, credit given, net cash in hand).

**Response `200 OK`:**
```json
{
  "totalSales": 45000.0,
  "totalCashCollected": 38000.0,
  "totalCreditGiven": 7000.0,
  "totalDeposited": 30000.0,
  "netCashInHand": 8000.0
}
```

---

### `DELETE /api/vehicles/{id}` 🛡️
Delete a vehicle.

**Response `204 No Content`**

---

## 8. Seller Portal — `/api/seller`

> All routes scoped to the authenticated seller's vehicle (vehicleId from JWT claim)

### `GET /api/seller/vehicle` 🚚
Get the seller's own vehicle info and mobile stock.

**Response `200 OK`:** `Vehicle` with `mobileStock`

---

### `GET /api/seller/transactions` 🚚
Get transactions made by this seller (sales + versements).

**Response `200 OK`:** list of `Transaction`

---

### `POST /api/seller/sale` 🚚
Record a mobile sale from the seller's truck.

**Request Body:** same as `/api/vehicles/{id}/mobile-sale`  
**Response `201 Created`:** list of created `Transaction`s  
**Returns `400`** if mobile stock is insufficient.

---

### `POST /api/seller/cash-drop` 🚚
Seller deposits collected cash back to the factory.

**Request Body:**
```json
{ "amount": 5000.0 }
```

**Response `201 Created`:**
```json
{
  "transaction": { ...VERSEMENT transaction... },
  "message": "Versement de 5000.0 MAD enregistré"
}
```

---

### `GET /api/seller/stats` 🚚
Get seller performance stats for the current period.

**Response `200 OK`:** `SellerStats` (same as `/api/vehicles/{id}/stats`)

---

## 9. HR & Timekeeping — `/api/hr`

### `GET /api/hr/employees` 🛡️
Get all employees.

**Response `200 OK`:** list of `Employee`

---

### `POST /api/hr/employees` 🛡️
Add a new employee.

**Request Body:**
```json
{
  "name": "Mohamed Benali",
  "role": "OUVRIER",
  "baseSalary": 100.0
}
```

**Response `201 Created`:** created `Employee`

---

### `DELETE /api/hr/employees/{id}` 🛡️
Delete an employee.

**Response `204 No Content`**

---

### `GET /api/hr/attendance` 🛡️
Get attendance records.

**Query Params:** `employeeId` (required), `weekStart` (YYYY-MM-DD, optional)

**Response `200 OK`:** list of `AttendanceRecord`

---

### `PUT /api/hr/attendance/{id}` 🛡️
Create or update an attendance record.

**Request Body:**
```json
{
  "id": null,
  "employeeId": 3,
  "date": "2026-02-24",
  "status": "PRESENT",
  "hoursNormal": 8.0,
  "hoursOvertime": 2.0,
  "advanceAmount": 0.0
}
```

**Response `200 OK`:** saved `AttendanceRecord`

---

### `GET /api/hr/salary/calculate` 🛡️
Calculate salary for an employee for a given period (does NOT save).

**Query Params:** `employeeId`, `periodStart` (YYYY-MM-DD), `periodType` (WEEKLY | MONTHLY)

**Response `200 OK`:**
```json
{
  "employeeId": 3,
  "employeeName": "Mohamed Benali",
  "periodStart": "2026-02-17",
  "periodEnd": "2026-02-23",
  "calculatedAmount": 750.0,
  "breakdown": {
    "daysPresent": 6,
    "halfDays": 1,
    "overtimeHours": 5,
    "advances": 100.0
  }
}
```

---

### `POST /api/hr/salary/pay` 👑
Record a salary payment (creates Expense or debits BankAccount).

**Request Body:**
```json
{
  "employeeId": 3,
  "periodStart": "2026-02-17",
  "amount": 650.0,
  "method": "ESPECE",
  "bankAccountId": null
}
```

**Response `201 Created`:** created `SalaryPayment`

---

### `GET /api/hr/salary/history` 🛡️
Get salary payment history.

**Query Params:** `employeeId` (optional)

**Response `200 OK`:** list of `SalaryPayment`

---

### `DELETE /api/hr/salary/{id}` 👑
Delete a salary payment record.

**Response `204 No Content`**

---

## 10. Fuel Management — `/api/fuel`

### `GET /api/fuel/stock` 🛡️
Get current fuel stock level (derived from all logs).

**Response `200 OK`:**
```json
{
  "currentStock": 1850.0,
  "isLowStock": false,
  "threshold": 500.0
}
```

---

### `GET /api/fuel/logs` 🛡️
Get all fuel logs.

**Response `200 OK`:** list of `FuelLog`

---

### `POST /api/fuel/purchase` 🛡️
Record a fuel purchase.

**Request Body:**
```json
{
  "quantity": 1000.0,
  "cost": 14000.0,
  "paymentMethod": "ESPECE"
}
```

**Response `201 Created`:** created `FuelLog`  
**Side effect:** Creates a `CARBURANT` expense.

---

### `POST /api/fuel/consume` 🛡️
Record fuel consumption by a vehicle.

**Request Body:**
```json
{
  "vehicleId": 2,
  "quantity": 80.0
}
```

**Response `201 Created`:** created `FuelLog`  
**Returns `400`** if insufficient fuel stock.

---

### `DELETE /api/fuel/logs/{id}` 🛡️
Delete a fuel log entry.

**Response `204 No Content`**

---

## 11. Contracts — `/api/contracts`

### `GET /api/contracts` 🛡️
Get all contracts.

**Query Params:** `status` (EN_COURS | TERMINE | ANNULE)

**Response `200 OK`:** list of `Contract` with allocations

---

### `POST /api/contracts` 🛡️
Create a new contract.

**Request Body:**
```json
{
  "clientName": "Export Marrakech SARL",
  "productType": "HUILE_VRAC",
  "targetQuantity": 5000.0,
  "targetAcidity": 1.0,
  "targetWaxes": 200,
  "priceSell": 18.5,
  "reference": "CTR-2026-001"
}
```

**Response `201 Created`:** created `Contract`

---

### `POST /api/contracts/{id}/allocate` 🛡️
Allocate oil from a tank to a contract. Reduces tank level. Auto-terminates contract when fully allocated.

**Request Body:**
```json
{
  "tankId": 1,
  "quantity": 1200.0,
  "costPrice": 12.50
}
```

**Response `200 OK`:** updated `Contract` with new allocation  
**Returns `400`** if tank has insufficient oil or allocation exceeds remaining target.

---

### `GET /api/contracts/{id}/stats` 🛡️
Get contract statistics (progress, profit, margin).

**Response `200 OK`:** `ContractStats`
```json
{
  "totalAllocated": 2400.0,
  "progressPercentage": 48.0,
  "avgAcidity": 0.83,
  "avgWaxes": 152,
  "totalCost": 30000.0,
  "totalRevenue": 44400.0,
  "profit": 14400.0,
  "profitMargin": 32.43
}
```

---

### `PATCH /api/contracts/{id}/status` 🛡️
Manually update contract status (e.g., ANNULE).

**Request Body:**
```json
{ "status": "ANNULE" }
```

**Response `200 OK`:** updated `Contract`

---

### `DELETE /api/contracts/{id}` 🛡️
Delete a contract (only if status is ANNULE).

**Response `204 No Content`**

---

## 12. Invoices — `/api/invoices`

### `GET /api/invoices` 🛡️
Get all invoices.

**Response `200 OK`:** list of `Invoice`

---

### `GET /api/invoices/{id}` 🛡️
Get a single invoice by ID.

**Response `200 OK`:** `Invoice` with items

---

### `POST /api/invoices` 🛡️
Create a new invoice. Invoice number is auto-generated.

**Request Body:**
```json
{
  "date": "2026-02-24",
  "clientName": "Export Marrakech SARL",
  "clientAddress": "Rue Ibn Sina, Marrakech",
  "clientIce": "002345678000012",
  "tvaRate": 0.20,
  "paymentMode": "Virement",
  "items": [
    {
      "description": "Huile d'Olive Vrac",
      "quantity": 1000,
      "unitPrice": 18.5
    }
  ]
}
```

**Response `201 Created`:** created `Invoice` with auto-calculated totals and generated number

---

### `DELETE /api/invoices/{id}` 🛡️
Delete an invoice.

**Response `204 No Content`**

---

### `GET /api/invoices/{id}/pdf` 🛡️
Generate and download the invoice as a PDF.

**Response `200 OK`:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="facture-76-25.pdf"`
- Body: raw PDF bytes

---

### `GET /api/invoices/next-number` 🛡️
Preview the next auto-generated invoice number.

**Response `200 OK`:**
```json
{ "nextNumber": "77/26" }
```

---

## 13. Email System — `/api/email`

### `GET /api/email/accounts` 🛡️
Get all email accounts.

**Response `200 OK`:** list of `EmailAccount`

---

### `POST /api/email/accounts` 🛡️
Add a new internal email account.

**Request Body:**
```json
{
  "displayName": "Service Technique",
  "email": "technique@marrakech-agro.com"
}
```

**Response `201 Created`:** created `EmailAccount`

---

### `GET /api/email/messages` 🛡️
Get messages for a given account and folder.

**Query Params:** `accountId` (required), `folder` (INBOX | SENT | TRASH)

**Response `200 OK`:** list of `EmailMessage`

---

### `POST /api/email/send` 🛡️
Send a message. If recipient is an internal account, creates an INBOX copy.

**Request Body:**
```json
{
  "fromAccountId": 1,
  "to": "commercial@marrakech-agro.com",
  "subject": "Commande urgente",
  "body": "Bonjour, merci de confirmer la livraison de vendredi."
}
```

**Response `201 Created`:** the sent `EmailMessage`

---

### `PATCH /api/email/messages/{id}/read` 🛡️
Mark a message as read.

**Response `200 OK`:** updated `EmailMessage`

---

### `PATCH /api/email/messages/{id}/trash` 🛡️
Move a message to trash folder.

**Response `200 OK`:** updated `EmailMessage`

---

### `DELETE /api/email/messages/{id}` 🛡️
Permanently delete a message.

**Response `204 No Content`**

---

### `GET /api/email/accounts/{id}/unread-count` 🛡️
Get unread inbox message count for an account.

**Response `200 OK`:**
```json
{ "accountId": 1, "unreadCount": 3 }
```

---

## 14. Dashboard — `/api/dashboard`

### `GET /api/dashboard/stats` 🛡️
Get main dashboard KPIs.

**Response `200 OK`:**
```json
{
  "totalSales": 520000.0,
  "netProfit": 186000.0,
  "totalOilVolume": 18500.0,
  "totalOilCapacity": 35000.0,
  "capacityUtilizationPercent": 52.86,
  "totalTransactionCount": 142
}
```

---

### `GET /api/dashboard/chart/weekly-sales` 🛡️
Get daily sales totals for the last 7 days.

**Response `200 OK`:**
```json
[
  { "label": "Lun", "value": 12000.0, "date": "2026-02-18" },
  { "label": "Mar", "value": 8500.0,  "date": "2026-02-19" },
  ...
]
```

---

### `GET /api/dashboard/alerts` 🛡️+🚚
Get system alerts counts.

**Response `200 OK`:**
```json
{
  "unreadEmails": 3,
  "urgentChecks": 1,
  "lowFuel": 0,
  "lowTankCount": 2
}
```

---

## 15. Activity Log — `/api/logs`

### `GET /api/logs` 🛡️
Get all activity logs (newest first).

**Query Params:** `username`, `startDate`, `endDate`, `page`, `size`

**Response `200 OK`:** paginated list of `ActivityLog`

---

### `GET /api/logs/user/{username}` 🛡️
Get logs filtered by user.

**Response `200 OK`:** list of `ActivityLog`

---

## 16. Admin Panel — `/api/admin`

> 👑 `SUPER_ADMIN` only

### `GET /api/admin/users` 👑
Get all system users with their blocked status.

**Response `200 OK`:**
```json
[
  { "username": "hajar", "role": "ADMIN", "isBlocked": false },
  { "username": "safae", "role": "ADMIN", "isBlocked": false },
  { "plateNumber": "45678-A-2", "role": "SELLER", "isBlocked": false }
]
```

---

### `POST /api/admin/users/block` 👑
Block a user (by username or plate number).

**Request Body:**
```json
{ "username": "hajar" }
```

**Response `200 OK`:**
```json
{ "message": "User hajar has been blocked" }
```
**Returns `400`** if target is `mojo` or `boss`.

---

### `POST /api/admin/users/unblock` 👑
Unblock a user.

**Request Body:**
```json
{ "username": "hajar" }
```

**Response `200 OK`:**
```json
{ "message": "User hajar has been unblocked" }
```

---

## 17. Common Error Responses

All errors follow this structure:

```json
{
  "timestamp": "2026-02-24T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Insufficient stock for ZITLBLAD 1L. Available: 5, Requested: 20",
  "path": "/api/vehicles/3/load"
}
```

| HTTP Status | Meaning |
|---|---|
| `200 OK` | Success (GET, PATCH) |
| `201 Created` | Resource created (POST) |
| `204 No Content` | Success, no body (DELETE) |
| `400 Bad Request` | Validation error or business rule violation |
| `401 Unauthorized` | Missing or invalid JWT |
| `403 Forbidden` | Insufficient role or user is blocked |
| `404 Not Found` | Resource not found |
| `409 Conflict` | Duplicate resource (e.g., plate number already exists) |
| `500 Internal Server Error` | Unexpected server error |

---

## 18. WebSocket Alerts — `ws://<host>:<port>/ws/alerts`

Use a native WebSocket to receive real-time alerts for the sidebar notification badges. This replaces client polling for alerts.

- Connect to: `ws://localhost:8080/ws/alerts?token=<JWT>`
  - The client must include a valid JWT in the `token` query parameter during the WebSocket handshake.
  - If the token is invalid or the user is blocked the server will close the connection.
- Message payload (JSON):
```json
{
  "unreadEmails": 3,
  "urgentChecks": 1,
  "lowFuel": 0,
  "lowTankCount": 2
}
```
- Which events trigger a broadcast:
  - New email received or message read/unread (EmailService)
  - Bank check added or status changed (AccountingService)
  - Fuel purchase or consumption (FuelService)
  - Tank level changes (TankService) — purchases, production fills, transfers, manual adjustments
- The REST endpoint `GET /api/dashboard/alerts` is still available for an initial snapshot before opening the socket.

---

### Invoices — Notes about PDF

`GET /api/invoices/{id}/pdf` generates the official invoice PDF on the server and returns it as `application/pdf` bytes. The frontend should use this endpoint to download printable invoices. The server also returns `amountInWords` (French) on invoice create/read responses; this value is generated by the backend and is authoritative.

---
