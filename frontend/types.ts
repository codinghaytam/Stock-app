
export enum ProductType {
  OLIVE = 'Olive',
  NOYAUX = 'Noyaux',
  HUILE_VRAC = 'Huile Vrac',
  HUILE_BOUTEILLE = 'Huile Bouteille',
  GRIGNONS = 'Grignons',
  FITOUR = 'Fitour'
}

export enum Brand {
  ZITLBLAD = 'ZITLBLAD',
  ASSLIA = 'ASSLIA',
  SERGHINIA = 'SERGHINIA',
  KOUTOBIA = 'KOUTOBIA'
}

export enum TransactionType {
  ACHAT = 'Achat',
  VENTE = 'Vente',
  PRODUCTION = 'Production',
  CHARGEMENT_CAMION = 'Chargement Camion',
  VERSEMENT = 'Versement Caisse' // Nouveau: Le vendeur donne l'argent à l'usine
}

export enum PaymentMethod {
  ESPECE = 'Espèce',
  CAISSE_DIRECTEUR = 'Caisse Directeur', // Nouvelle Caisse Privée
  CHEQUE = 'Chèque',
  VIREMENT = 'Virement',
  CREDIT = 'Crédit (Dette)',
  TIERS = 'Par Tiers (Externe)' // Paid by someone else (Boss, Partner, etc.) - No cash flow impact
}

export enum PaymentStatus {
  PAYE = 'Payé',
  PARTIEL = 'Partiel',
  IMPAYE = 'Impayé'
}

export enum Currency {
  MAD = 'MAD',
  EUR = 'EUR',
  USD = 'USD'
}

export interface BankAccount {
  id: string;
  bankName: string; // ex: CIH, BMCE
  accountNumber: string;
  currency: Currency;
  balance: number;
}

export interface Tank {
  id: string;
  name: string;
  capacity: number; // in Liters
  currentLevel: number; // in Liters
  acidity: number; // %
  waxes: number; // mg/kg
  avgCost: number; // Prix de revient moyen par litre
  status: 'Empty' | 'Filling' | 'Full' | 'Maintenance';
}

export type BottleSize = '1L' | '1/2 L' | '2L' | '5L';

export interface StockItem {
  id: string;
  name: string;
  type: ProductType;
  quantity: number;
  unit: 'kg' | 'L' | 'unités';
  brand?: Brand; // Only for bottles
  bottleSize?: BottleSize; // Only for bottles
}

// Item inside a truck
export interface MobileStockItem {
  stockItemId: string; // Reference to the original product type ID or constructed ID
  name: string;
  brand: Brand;
  bottleSize: BottleSize;
  quantity: number;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  driverName: string;
  type: 'Camion' | 'Camionnette' | 'Utilitaire';
  status: 'Disponible' | 'En Mission' | 'Maintenance';
  // Mission details
  currentDestination?: string; // Client or Location
  currentLoadType?: string;
  currentLoadQuantity?: number;
  lastActive?: string;
  mobileStock?: MobileStockItem[]; // Inventory currently in the vehicle
}

export interface TankDistribution {
  tankId: string;
  quantity: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  productType: ProductType; // For VERSEMENT, can be generic or null logic
  quantity: number;
  unit: 'kg' | 'L' | 'unités';
  
  // Pricing & Currency
  priceTotal: number; // Always converted to MAD for stats
  originalAmount?: number; // Amount in original currency
  currency: Currency;
  exchangeRate: number; // 1 if MAD

  partnerName: string; // Client or Supplier
  truckPlate?: string; // For external trucks or history
  vehicleId?: string; // Link to internal tracked vehicle
  
  // Tank Logic (Simple or Multi)
  tankId?: string; // Legacy / Primary tank
  tankDistributions?: TankDistribution[]; // NEW: Multi-tank support

  acidity?: number;
  waxes?: number;

  details?: string; // e.g., "Acidity: 0.8, Cires: 150" for bulk
  location?: string; // GPS Coordinates
  
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  amountPaid?: number; // In MAD
  bankAccountId?: string; // If paid by Virement
}

export interface Expense {
  id: string;
  date: string;
  category: 'Electricité' | 'Carburant' | 'Maintenance' | 'Salaires' | 'Transfert' | 'Autre';
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

export interface Check {
  id: string;
  number: string;
  bank: string;
  amount: number;
  dueDate: string; // Date d'encaissement prévue
  status: 'En Coffre' | 'Déposé' | 'Encaissé' | 'Rejeté';
  direction: 'Recu' | 'Emis'; // Recu de client ou Emis vers fournisseur
  partnerName: string;
}

// RH & Pointage
export interface Employee {
  id: string;
  name: string;
  role: 'Ouvrier' | 'Employé';
  baseSalary: number; // Mensuel pour employé, Journalier (100dh) pour ouvrier
}

export interface AttendanceRecord {
  id: string;
  date: string;
  employeeId: string;
  status: 'Présent' | 'Absent' | 'Congé' | 'Matin' | 'Après-midi';
  hoursNormal: number; // Standard 8h
  hoursOvertime: number; // Heures supp
  advanceAmount?: number; // Avance donnée ce jour-là (Crédit)
}

// New: Suivi paiement salaire
export interface SalaryPayment {
  id: string;
  employeeId: string;
  periodStart: string; // Date début semaine ou mois
  amount: number;
  method: PaymentMethod | 'Impayé';
  bankAccountId?: string; // Si virement
  date: string; // Date du paiement
}

// New Interface for Activity History
export interface LogEntry {
  id: string;
  date: string;
  user: string; // 'Admin' or 'Vendeur X'
  action: string; // 'Vente', 'Chargement', 'Production', etc.
  details: string;
  amount?: number; // Optional financial impact
}

// New Interface for Fuel Management
export interface FuelLog {
  id: string;
  date: string;
  type: 'ACHAT' | 'CONSOMMATION'; 
  quantity: number; // Liters
  cost?: number; // For Purchase (MAD)
  vehicleId?: string; // For Consumption
  driverName?: string;
  plateNumber?: string; // NEW: Explicit plate number
  currentStockAfter: number;
}

// --- EMAIL SYSTEM ---
export interface EmailAccount {
  id: string;
  email: string;
  name: string;
  color: string; // Tailwind color class e.g. "bg-blue-500"
}

export interface EmailMessage {
  id: string;
  accountId: string; // The account that OWNS this copy of the message
  folder: 'inbox' | 'sent' | 'trash';
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  number: string; // e.g., "76/25"
  date: string;
  clientName: string;
  clientAddress: string;
  clientIce: string;
  items: InvoiceItem[];
  totalHT: number;
  tvaRate: number; // e.g., 0.20
  tvaAmount: number;
  totalTTC: number;
  amountInWords: string;
  paymentMode: string;
}

export interface ContractAllocation {
  id: string;
  date: string;
  sourceId: string; // Tank ID
  sourceName: string;
  quantity: number;
  acidity: number;
  waxes: number;
  costPrice: number; // Prix de revient (pour calcul bénéfice)
}

export interface Contract {
  id: string;
  clientName: string;
  productType: ProductType;
  targetQuantity: number;
  targetAcidity: number; // Max
  targetWaxes: number; // Max
  priceSell: number; // Prix de vente unitaire
  status: 'En Cours' | 'Terminé' | 'Annulé';
  allocations: ContractAllocation[];
  createdAt: string;
}
