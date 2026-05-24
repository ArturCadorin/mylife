// ── Family Group ──────────────────────────────────────────────────────────────

export interface FamilyGroupResponse {
  id: number;
  name: string;
  createdAt: string;
  members: { id: number; name: string; email: string; role: Role }[];
}

export interface FamilyGroupRequest {
  name: string;
}

export interface AddMemberRequest {
  email: string;
}

export interface UpdateProfileRequest {
  name: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message: string;
  status: 'SUCCESS' | 'ERROR' | 'VALIDATION_ERROR';
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export type Role = 'OWNER' | 'MEMBER';
export type ProductType = 'FINANCE' | 'FITNESS';

export interface AuthResponse {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
  products: ProductType[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: Role;
  products: ProductType[];
}

// ── Finance ──────────────────────────────────────────────────────────────────

export type TransactionType = 'INCOME' | 'EXPENSE';

export type TransactionCategory =
  | 'SALARY' | 'FREELANCE' | 'INVESTMENT_RETURN' | 'RENTAL' | 'OTHER_INCOME'
  | 'FOOD' | 'TRANSPORT' | 'HEALTH' | 'EDUCATION' | 'LEISURE'
  | 'CLOTHING' | 'HOME' | 'VEHICLE' | 'SUBSCRIPTIONS' | 'CREDIT_CARD' | 'OTHER_EXPENSE';

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  SALARY:            'Salário',
  FREELANCE:         'Freelance',
  INVESTMENT_RETURN: 'Retorno de investimento',
  RENTAL:            'Aluguel',
  OTHER_INCOME:      'Outras receitas',
  FOOD:              'Alimentação',
  TRANSPORT:         'Transporte',
  HEALTH:            'Saúde',
  EDUCATION:         'Educação',
  LEISURE:           'Lazer',
  CLOTHING:          'Vestuário',
  HOME:              'Moradia',
  VEHICLE:           'Veículo',
  SUBSCRIPTIONS:     'Assinaturas',
  CREDIT_CARD:       'Cartão de crédito',
  OTHER_EXPENSE:     'Outras despesas',
};

export const INCOME_CATEGORIES: TransactionCategory[] = [
  'SALARY', 'FREELANCE', 'INVESTMENT_RETURN', 'RENTAL', 'OTHER_INCOME',
];

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'FOOD', 'TRANSPORT', 'HEALTH', 'EDUCATION', 'LEISURE',
  'CLOTHING', 'HOME', 'VEHICLE', 'SUBSCRIPTIONS', 'CREDIT_CARD', 'OTHER_EXPENSE',
];

export type RecurrenceType = 'NONE' | 'AUTOMATIC' | 'MANUAL';
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export const RECURRENCE_FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  DAILY:   'Diária',
  WEEKLY:  'Semanal',
  MONTHLY: 'Mensal',
  YEARLY:  'Anual',
};

// ── Account ──────────────────────────────────────────────────────────────────

export type AccountType = 'CHECKING' | 'SAVINGS' | 'CASH' | 'DIGITAL';

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CHECKING: 'Conta Corrente',
  SAVINGS:  'Poupança',
  CASH:     'Dinheiro',
  DIGITAL:  'Conta Digital',
};

export interface AccountResponse {
  id: number;
  name: string;
  bankName: string;
  type: AccountType;
  balance: number;
  currency: string;
  active: boolean;
  createdAt: string;
  ownerId: number;
  ownerName: string;
}

// ── Overview / Dashboard ──────────────────────────────────────────────────────

export interface AccountSummary {
  accountId: number;
  accountName: string;
  balance: number;
  bankName: string;
}

export interface SavingsSummary {
  savingsId: number;
  name: string;
  currentAmount: number;
  targetAmount: number | null;
  progressPercentage: number | null;
}

export interface FinancialOverviewResponse {
  totalBalanceAllAccounts: number;
  totalSavings: number;
  totalInvestments: number;
  totalCreditCardDebt: number;
  netWorth: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  currentMonthBalance: number;
  accountSummaries: AccountSummary[];
  savingsSummaries: SavingsSummary[];
}

// ── Transaction ───────────────────────────────────────────────────────────────

export interface TransactionResponse {
  id: number;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  description: string;
  note: string | null;
  accountId: number;
  accountName: string;
  ownerId: number;
  ownerName: string;
  recurrenceType: RecurrenceType;
  recurrenceFrequency: RecurrenceFrequency | null;
  recurrenceTotalCount: number | null;
  recurrenceCurrentCount: number | null;
  nextOccurrenceDate: string | null;
  parentTransactionId: number | null;
  pending: boolean;
  createdAt: string;
}

export interface TransactionRequest {
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  date: string;
  description: string;
  accountId: number;
  note?: string;
  recurrenceType: RecurrenceType;
  recurrenceFrequency?: RecurrenceFrequency;
  recurrenceEndDate?: string;
}

export interface TransactionUpdateRequest {
  description: string;
  amount: number;
  category: TransactionCategory;
  date: string;
  note?: string;
  updateFutureRecurrences: boolean;
}

export interface RecurrencePendingResponse {
  id: number;
  transactionId: number;
  description: string;
  expectedAmount: number;
  category: TransactionCategory;
  type: TransactionType;
  scheduledDate: string;
  accountName: string;
}

// ── Account requests ──────────────────────────────────────────────────────────

export interface AccountRequest {
  name: string;
  bankName: string;
  type: AccountType;
  currency: string;
  initialBalance: number;
}

export interface AccountUpdateRequest {
  name: string;
  bankName: string;
  type: AccountType;
  currency: string;
}

// ── Credit Card ───────────────────────────────────────────────────────────────

export type InvoiceStatus = 'OPEN' | 'CLOSED' | 'PAID';

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  OPEN:   'Em aberto',
  CLOSED: 'Fechada',
  PAID:   'Paga',
};

export interface CreditCardResponse {
  id: number;
  name: string;
  bankName: string | null;
  color: string | null;
  lastFourDigits: string;
  totalLimit: number;
  availableLimit: number;
  closingDay: number;
  dueDay: number;
  active: boolean;
  currentInvoiceTotal: number;
  linkedAccountId: number | null;
  linkedAccountName: string | null;
  ownerId: number;
  ownerName: string;
}

export interface CreditCardRequest {
  name: string;
  bankName?: string;
  color?: string;
  lastFourDigits: string;
  totalLimit: number;
  closingDay: number;
  dueDay: number;
  linkedAccountId?: number;
}

export interface CreditCardUpdateRequest {
  name: string;
  bankName?: string;
  color?: string;
  lastFourDigits?: string;
  totalLimit: number;
  closingDay: number;
  dueDay: number;
  linkedAccountId?: number;
}

export interface CreditCardTransactionResponse {
  id: number;
  creditCardId: number;
  creditCardName: string;
  invoiceId: number;
  invoiceReferenceMonth: string;
  description: string;
  totalAmount: number;
  installmentAmount: number;
  installmentNumber: number;
  totalInstallments: number;
  category: TransactionCategory;
  purchaseDate: string;
  note: string | null;
  lastInstallment: boolean;
  ownerId: number;
  ownerName: string;
}

export interface CreditCardTransactionRequest {
  description: string;
  totalAmount: number;
  purchaseDate: string;
  category: TransactionCategory;
  totalInstallments: number;
  note?: string;
}

export interface InvoiceSummaryResponse {
  id: number;
  yearMonth: string;
  totalAmount: number;
  status: InvoiceStatus;
  closingDate: string;
  dueDate: string;
  paidAt: string | null;
}

export interface InvoiceResponse {
  id: number;
  creditCardId: number;
  yearMonth: string;
  totalAmount: number;
  status: InvoiceStatus;
  closingDate: string;
  dueDate: string;
  paidAt: string | null;
  paidAmount: number | null;
  transactions: CreditCardTransactionResponse[];
}

export interface InvoicePaymentRequest {
  accountId: number;
  amount: number;
  paymentDate: string;
}

// ── Savings ───────────────────────────────────────────────────────────────────

export type SavingsEntryType = 'DEPOSIT' | 'WITHDRAWAL';

export interface SavingsResponse {
  id: number;
  name: string;
  description: string | null;
  targetAmount: number | null;
  currentAmount: number;
  cdiRate: number | null;
  currentCdiValue: number | null;
  estimatedReturn: number;
  linkedAccountId: number | null;
  linkedAccountName: string | null;
  ownerName: string;
  percentualDaMeta: number | null;
  createdAt: string;
}

export interface SavingsEntryResponse {
  id: number;
  savingsId: number;
  savingsName: string;
  type: SavingsEntryType;
  amount: number;
  date: string;
  note: string | null;
  createdAt: string;
}

export interface SavingsRequest {
  name: string;
  description?: string;
  targetAmount?: number;
  cdiRate?: number;
  currentCdiValue?: number;
  linkedAccountId?: number;
}

export interface SavingsUpdateRequest {
  name: string;
  description?: string;
  targetAmount?: number;
  cdiRate?: number;
  currentCdiValue?: number;
  linkedAccountId?: number;
}

export interface SavingsEntryRequest {
  type: SavingsEntryType;
  amount: number;
  date: string;
  note?: string;
}

// ── Investments ───────────────────────────────────────────────────────────────

export type InvestmentType = 'FIXED_INCOME' | 'STOCK' | 'FUND' | 'CRYPTO';
export type FixedIncomeIndexer = 'CDI' | 'SELIC' | 'IPCA' | 'PREFIXED' | 'OTHER';
export type InvestmentEntryType = 'DEPOSIT' | 'WITHDRAWAL' | 'YIELD_UPDATE';

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  FIXED_INCOME: 'Renda Fixa',
  STOCK:        'Ações',
  FUND:         'Fundos',
  CRYPTO:       'Criptomoedas',
};

export const FIXED_INCOME_INDEXER_LABELS: Record<FixedIncomeIndexer, string> = {
  CDI:      'CDI',
  SELIC:    'Selic',
  IPCA:     'IPCA+',
  PREFIXED: 'Prefixado',
  OTHER:    'Outro',
};

export interface InvestmentResponse {
  id: number;
  name: string;
  type: InvestmentType;
  institution: string;
  totalInvested: number;
  currentValue: number;
  yieldAmount: number;
  yieldPercentage: number;
  indexer?: FixedIncomeIndexer;
  indexerRate?: number;
  fixedRate?: number;
  currentIndexValue?: number;
  maturityDate?: string;
  estimatedReturn?: number;
  linkedAccountId?: number;
  linkedAccountName?: string;
  active: boolean;
  ownerName: string;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface InvestmentEntryResponse {
  id: number;
  investmentId: number;
  investmentName: string;
  type: InvestmentEntryType;
  amount: number;
  date: string;
  note: string | null;
  previousValue: number | null;
  createdAt: string;
}

export interface InvestmentSummaryResponse {
  totalInvested: number;
  totalCurrentValue: number;
  totalYield: number;
  totalYieldPercentage: number;
  byType: Record<InvestmentType, number>;
  investments: InvestmentResponse[];
}

export interface InvestmentRequest {
  name: string;
  type: InvestmentType;
  institution: string;
  initialAmount: number;
  indexer?: FixedIncomeIndexer;
  indexerRate?: number;
  fixedRate?: number;
  currentIndexValue?: number;
  maturityDate?: string;
  linkedAccountId?: number;
}

export interface InvestmentUpdateRequest {
  name: string;
  institution: string;
  indexer?: FixedIncomeIndexer;
  indexerRate?: number;
  fixedRate?: number;
  currentIndexValue?: number;
  maturityDate?: string;
  linkedAccountId?: number;
}

export interface InvestmentEntryRequest {
  type: InvestmentEntryType;
  amount: number;
  date: string;
  note?: string;
}

// ── Wishlist ──────────────────────────────────────────────────────────────────

export type WishListStatus   = 'PENDING' | 'PURCHASED' | 'CANCELLED';
export type WishListPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type WishListCategory =
  | 'ELECTRONICS' | 'CLOTHING' | 'HOME' | 'VEHICLE'
  | 'HEALTH' | 'EDUCATION' | 'LEISURE' | 'FOOD' | 'OTHER';

export const WISHLIST_PRIORITY_LABELS: Record<WishListPriority, string> = {
  HIGH:   'Alta',
  MEDIUM: 'Média',
  LOW:    'Baixa',
};

export const WISHLIST_CATEGORY_LABELS: Record<WishListCategory, string> = {
  ELECTRONICS: 'Eletrônicos',
  CLOTHING:    'Vestuário',
  HOME:        'Casa',
  VEHICLE:     'Veículo',
  HEALTH:      'Saúde',
  EDUCATION:   'Educação',
  LEISURE:     'Lazer',
  FOOD:        'Alimentação',
  OTHER:       'Outros',
};

export interface WishListItemResponse {
  id: number;
  name: string;
  description: string | null;
  estimatedPrice: number;
  category: WishListCategory;
  priority: WishListPriority;
  estimatedMonth: string;
  status: WishListStatus;
  purchasedAt: string | null;
  linkedTransactionId: number | null;
  linkedAccountName: string | null;
  ownerName: string;
  daysUntilEstimatedMonth: number;
  createdAt: string;
}

export interface WishListItemRequest {
  name: string;
  description?: string;
  estimatedPrice: number;
  category: WishListCategory;
  priority: WishListPriority;
  estimatedMonth: string;
  linkedAccountId?: number;
}

export interface WishListItemUpdateRequest {
  name: string;
  description?: string;
  estimatedPrice: number;
  category: WishListCategory;
  priority: WishListPriority;
  estimatedMonth: string;
  linkedAccountId?: number;
}

export interface PurchaseRequest {
  linkedAccountId?: number;
  note?: string;
}

// ── Month Simulator ───────────────────────────────────────────────────────────

export interface SimulatorItemResponse {
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  date: string;
  accountName: string;
  confirmed: boolean;
}

export interface CreditCardDueItem {
  cardName: string;
  bankName: string;
  color: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
}

export interface MonthSimulatorResponse {
  month: string;

  // Patrimônio atual
  netWorth: number;
  totalAccounts: number;
  totalSavings: number;
  totalInvestments: number;
  totalCreditCardDebt: number;

  // Itens do mês
  confirmedIncome: SimulatorItemResponse[];
  confirmedExpenses: SimulatorItemResponse[];
  pendingRecurringIncome: SimulatorItemResponse[];
  pendingRecurringExpenses: SimulatorItemResponse[];
  creditCardDueItems: CreditCardDueItem[];

  // Totais
  totalConfirmedIncome: number;
  totalConfirmedExpenses: number;
  totalPendingIncome: number;
  totalPendingExpenses: number;
  totalCreditCardDueThisMonth: number;
  totalProjectedIncome: number;
  totalProjectedExpenses: number;
  projectedMonthBalance: number;
  projectedNetWorth: number;
}

// ── Fit ───────────────────────────────────────────────────────────────────────

export type WorkoutType =
  | 'GYM' | 'RUNNING' | 'CYCLING' | 'SWIMMING'
  | 'WALKING' | 'YOGA' | 'HIIT' | 'FUNCTIONAL' | 'OTHER';

export type WorkoutStatus = 'PLANNED' | 'COMPLETED' | 'SKIPPED';
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
export type BiologicalSex = 'MALE' | 'FEMALE' | 'OTHER';

export const WORKOUT_TYPE_LABELS: Record<WorkoutType, string> = {
  GYM:        'Academia',
  RUNNING:    'Corrida',
  CYCLING:    'Ciclismo',
  SWIMMING:   'Natação',
  WALKING:    'Caminhada',
  YOGA:       'Yoga',
  HIIT:       'HIIT',
  FUNCTIONAL: 'Funcional',
  OTHER:      'Outro',
};

export const WORKOUT_TYPE_ICONS: Record<WorkoutType, string> = {
  GYM: '🏋️', RUNNING: '🏃', CYCLING: '🚴', SWIMMING: '🏊',
  WALKING: '🚶', YOGA: '🧘', HIIT: '⚡', FUNCTIONAL: '🤸', OTHER: '💪',
};

export const WORKOUT_STATUS_LABELS: Record<WorkoutStatus, string> = {
  PLANNED:   'Planejado',
  COMPLETED: 'Concluído',
  SKIPPED:   'Pulado',
};

export const ACTIVITY_LEVEL_LABELS: Record<ActivityLevel, string> = {
  SEDENTARY:  'Sedentário',
  LIGHT:      'Leve',
  MODERATE:   'Moderado',
  ACTIVE:     'Ativo',
  VERY_ACTIVE: 'Muito ativo',
};

export const BIOLOGICAL_SEX_LABELS: Record<BiologicalSex, string> = {
  MALE:   'Masculino',
  FEMALE: 'Feminino',
  OTHER:  'Outro',
};

export interface FitProfileResponse {
  id: number;
  userId: number;
  userName: string;
  heightCm: number | null;
  weightKg: number | null;
  targetWeightKg: number | null;
  birthDate: string | null;
  age: number | null;
  biologicalSex: BiologicalSex | null;
  activityLevel: ActivityLevel | null;
  bmi: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FitProfileRequest {
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  birthDate?: string;
  biologicalSex?: BiologicalSex;
  activityLevel?: ActivityLevel;
}

export interface BodyMeasurementResponse {
  id: number;
  userId: number;
  date: string;
  weightKg: number | null;
  bodyFatPercentage: number | null;
  muscleMassKg: number | null;
  waistCm: number | null;
  chestCm: number | null;
  hipsCm: number | null;
  leftArmCm: number | null;
  rightArmCm: number | null;
  leftThighCm: number | null;
  rightThighCm: number | null;
  note: string | null;
  createdAt: string;
}

export interface BodyMeasurementRequest {
  date: string;
  weightKg?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  waistCm?: number;
  chestCm?: number;
  hipsCm?: number;
  leftArmCm?: number;
  rightArmCm?: number;
  leftThighCm?: number;
  rightThighCm?: number;
  note?: string;
}

export interface WorkoutExerciseResponse {
  id: number;
  name: string;
  sets: number | null;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  exerciseOrder: number;
  note: string | null;
}

export interface WorkoutExerciseRequest {
  name: string;
  sets?: number;
  reps?: number;
  weightKg?: number;
  durationSeconds?: number;
  restSeconds?: number;
  exerciseOrder?: number;
  note?: string;
}

export interface WorkoutResponse {
  id: number;
  name: string;
  type: WorkoutType;
  typeLabel: string;
  date: string;
  startTime: string | null;
  durationMinutes: number | null;
  status: WorkoutStatus;
  caloriesBurned: number | null;
  heartRateAvg: number | null;
  distanceKm: number | null;
  pace: string | null;
  note: string | null;
  exercises: WorkoutExerciseResponse[];
  ownerId: number;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutRequest {
  name: string;
  type: WorkoutType;
  date: string;
  startTime?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  heartRateAvg?: number;
  distanceKm?: number;
  pace?: string;
  note?: string;
  exercises?: WorkoutExerciseRequest[];
}

export interface WorkoutUpdateRequest {
  name: string;
  type: WorkoutType;
  date: string;
  status: WorkoutStatus;
  startTime?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  heartRateAvg?: number;
  distanceKm?: number;
  pace?: string;
  note?: string;
}

export interface WorkoutSummaryResponse {
  totalWorkoutsThisMonth: number;
  totalWorkoutsLastMonth: number;
  totalMinutesThisMonth: number;
  totalCaloriesThisMonth: number;
  totalDistanceKmThisMonth: number;
  currentStreak: number;
  byType: Partial<Record<WorkoutType, number>>;
  nextPlanned: WorkoutResponse | null;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface MonthlySummaryResponse {
  referenceMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalCreditCardSpending: number;
  netBalance: number;
}

export interface CategorySummaryResponse {
  category: TransactionCategory;
  totalAmount: number;
  transactionCount: number;
  percentageOfTotal: number;
}

export interface MonthlyComparisonResponse {
  currentMonth: string;
  previousMonth: string;
  currentIncome: number;
  previousIncome: number;
  incomeVariation: number;
  currentExpense: number;
  previousExpense: number;
  expenseVariation: number;
  currentBalance: number;
  previousBalance: number;
  balanceVariation: number;
}

export interface RecurrenceProjectionResponse {
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  expectedDate: string;
  recurrenceFrequency: RecurrenceFrequency | null;
  accountName: string | null;
  creditCardName: string | null;
}
