'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  ApiResponse,
  PageResponse,
  FinancialOverviewResponse,
  TransactionResponse,
  TransactionRequest,
  TransactionUpdateRequest,
  AccountResponse,
  AccountRequest,
  AccountUpdateRequest,
  CreditCardResponse,
  CreditCardRequest,
  CreditCardUpdateRequest,
  CreditCardTransactionResponse,
  CreditCardTransactionRequest,
  InvoiceSummaryResponse,
  InvoiceResponse,
  InvoicePaymentRequest,
  SavingsResponse,
  SavingsRequest,
  SavingsUpdateRequest,
  SavingsEntryResponse,
  SavingsEntryRequest,
  InvestmentResponse,
  InvestmentSummaryResponse,
  InvestmentRequest,
  InvestmentUpdateRequest,
  InvestmentEntryResponse,
  InvestmentEntryRequest,
  WishListItemResponse,
  WishListItemRequest,
  WishListItemUpdateRequest,
  WishListStatus,
  PurchaseRequest,
  MonthlySummaryResponse,
  CategorySummaryResponse,
  MonthlyComparisonResponse,
  RecurrenceProjectionResponse,
  TransactionType,
} from '@/types/api';

// ── Overview ─────────────────────────────────────────────────────────────────

export function useOverview() {
  return useQuery({
    queryKey: ['finance', 'overview'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FinancialOverviewResponse>>(
        '/finance/reports/overview'
      );
      return data.data;
    },
  });
}

export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: ['finance', 'transactions', 'recent', limit],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PageResponse<TransactionResponse>>>(
        `/finance/transactions?page=0&size=${limit}&sort=date,desc`
      );
      return data.data.content;
    },
  });
}

// ── Transactions ──────────────────────────────────────────────────────────────

export interface TransactionFilters {
  startDate: string;
  endDate: string;
  page: number;
  size: number;
}

export function useTransactions(filters: TransactionFilters) {
  return useQuery({
    queryKey: ['finance', 'transactions', filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: String(filters.page),
        size: String(filters.size),
      });
      const { data } = await api.get<ApiResponse<PageResponse<TransactionResponse>>>(
        `/finance/transactions?${params}`
      );
      return data.data;
    },
  });
}

export function useCreateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: TransactionRequest) => {
      const { data } = await api.post<ApiResponse<TransactionResponse>>(
        '/finance/transactions',
        req
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'transactions'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useUpdateTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: TransactionUpdateRequest }) => {
      const { data } = await api.put<ApiResponse<TransactionResponse>>(
        `/finance/transactions/${id}`,
        req
      );
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'transactions'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/finance/transactions/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'transactions'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

// ── Accounts ──────────────────────────────────────────────────────────────────

export function useAccounts() {
  return useQuery({
    queryKey: ['finance', 'accounts'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PageResponse<AccountResponse>>>(
        '/finance/accounts?page=0&size=100'
      );
      return data.data.content;
    },
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: AccountRequest) => {
      const { data } = await api.post<ApiResponse<AccountResponse>>('/finance/accounts', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'accounts'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: AccountUpdateRequest }) => {
      const { data } = await api.put<ApiResponse<AccountResponse>>(`/finance/accounts/${id}`, req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'accounts'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useDeactivateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/finance/accounts/${id}/deactivate`, null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'accounts'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/finance/accounts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'accounts'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

// ── Credit Cards ──────────────────────────────────────────────────────────────

export function useCreditCards() {
  return useQuery({
    queryKey: ['finance', 'credit-cards'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CreditCardResponse[]>>('/finance/credit-cards');
      return data.data;
    },
  });
}

export function useCreditCard(id: number) {
  return useQuery({
    queryKey: ['finance', 'credit-cards', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CreditCardResponse>>(`/finance/credit-cards/${id}`);
      return data.data;
    },
    enabled: id > 0,
  });
}

export function useCreateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: CreditCardRequest) => {
      const { data } = await api.post<ApiResponse<CreditCardResponse>>('/finance/credit-cards', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'credit-cards'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useUpdateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: CreditCardUpdateRequest }) => {
      const { data } = await api.put<ApiResponse<CreditCardResponse>>(`/finance/credit-cards/${id}`, req);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['finance', 'credit-cards'] });
      qc.invalidateQueries({ queryKey: ['finance', 'credit-cards', id] });
    },
  });
}

export function useDeactivateCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/finance/credit-cards/${id}/deactivate`, null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'credit-cards'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useDeleteCreditCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/finance/credit-cards/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'credit-cards'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useInvoices(cardId: number) {
  return useQuery({
    queryKey: ['finance', 'credit-cards', cardId, 'invoices'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InvoiceSummaryResponse[]>>(
        `/finance/credit-cards/${cardId}/invoices`
      );
      return data.data;
    },
    enabled: cardId > 0,
  });
}

export function useInvoice(cardId: number, yearMonth: string) {
  return useQuery({
    queryKey: ['finance', 'credit-cards', cardId, 'invoices', yearMonth],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InvoiceResponse>>(
        `/finance/credit-cards/${cardId}/invoices/${yearMonth}`
      );
      return data.data;
    },
    enabled: cardId > 0 && !!yearMonth,
  });
}

export function useCreateCardTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, req }: { cardId: number; req: CreditCardTransactionRequest }): Promise<CreditCardTransactionResponse> => {
      const { data } = await api.post<ApiResponse<CreditCardTransactionResponse>>(
        `/finance/credit-cards/${cardId}/transactions`,
        req
      );
      return data.data;
    },
    onSuccess: (_, { cardId }) => {
      qc.invalidateQueries({ queryKey: ['finance', 'credit-cards', cardId] });
      qc.invalidateQueries({ queryKey: ['finance', 'credit-cards', cardId, 'invoices'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function usePayInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, req }: { invoiceId: number; req: InvoicePaymentRequest }) => {
      await api.post(`/finance/credit-cards/invoices/${invoiceId}/pay`, req);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'credit-cards'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

// ── Savings ───────────────────────────────────────────────────────────────────

export function useSavings() {
  return useQuery({
    queryKey: ['finance', 'savings'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PageResponse<SavingsResponse>>>('/finance/savings?size=100');
      return data.data.content;
    },
  });
}

export function useSaving(id: number) {
  return useQuery({
    queryKey: ['finance', 'savings', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SavingsResponse>>(`/finance/savings/${id}`);
      return data.data;
    },
    enabled: id > 0,
  });
}

export function useCreateSavings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: SavingsRequest) => {
      const { data } = await api.post<ApiResponse<SavingsResponse>>('/finance/savings', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'savings'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useUpdateSavings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: SavingsUpdateRequest }) => {
      const { data } = await api.put<ApiResponse<SavingsResponse>>(`/finance/savings/${id}`, req);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['finance', 'savings'] });
      qc.invalidateQueries({ queryKey: ['finance', 'savings', id] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useDeleteSavings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/finance/savings/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'savings'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useSavingsEntries(id: number, page = 0, size = 20) {
  return useQuery({
    queryKey: ['finance', 'savings', id, 'entries', page, size],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PageResponse<SavingsEntryResponse>>>(
        `/finance/savings/${id}/entries?page=${page}&size=${size}`
      );
      return data.data;
    },
    enabled: id > 0,
  });
}

export function useAddSavingsEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: SavingsEntryRequest }) => {
      const { data } = await api.post<ApiResponse<SavingsEntryResponse>>(
        `/finance/savings/${id}/entries`,
        req
      );
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['finance', 'savings', id] });
      qc.invalidateQueries({ queryKey: ['finance', 'savings', id, 'entries'] });
      qc.invalidateQueries({ queryKey: ['finance', 'savings'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

// ── Investments ───────────────────────────────────────────────────────────────

export function useInvestments() {
  return useQuery({
    queryKey: ['finance', 'investments'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InvestmentResponse[]>>('/finance/investments');
      return data.data;
    },
  });
}

export function useInvestmentSummary() {
  return useQuery({
    queryKey: ['finance', 'investments', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InvestmentSummaryResponse>>('/finance/investments/summary');
      return data.data;
    },
  });
}

export function useInvestment(id: number) {
  return useQuery({
    queryKey: ['finance', 'investments', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<InvestmentResponse>>(`/finance/investments/${id}`);
      return data.data;
    },
    enabled: id > 0,
  });
}

export function useCreateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: InvestmentRequest) => {
      const { data } = await api.post<ApiResponse<InvestmentResponse>>('/finance/investments', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'investments'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useUpdateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: InvestmentUpdateRequest }) => {
      const { data } = await api.put<ApiResponse<InvestmentResponse>>(`/finance/investments/${id}`, req);
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['finance', 'investments'] });
      qc.invalidateQueries({ queryKey: ['finance', 'investments', id] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useDeactivateInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/finance/investments/${id}/deactivate`, null);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'investments'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useInvestmentEntries(id: number, page = 0, size = 20) {
  return useQuery({
    queryKey: ['finance', 'investments', id, 'entries', page, size],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PageResponse<InvestmentEntryResponse>>>(
        `/finance/investments/${id}/entries?page=${page}&size=${size}`
      );
      return data.data;
    },
    enabled: id > 0,
  });
}

export function useAddInvestmentEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: InvestmentEntryRequest }): Promise<InvestmentEntryResponse> => {
      const { data } = await api.post<ApiResponse<InvestmentEntryResponse>>(
        `/finance/investments/${id}/entries`,
        req
      );
      return data.data;
    },
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['finance', 'investments', id] });
      qc.invalidateQueries({ queryKey: ['finance', 'investments', id, 'entries'] });
      qc.invalidateQueries({ queryKey: ['finance', 'investments'] });
      qc.invalidateQueries({ queryKey: ['finance', 'investments', 'summary'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

// ── Wishlist ──────────────────────────────────────────────────────────────────

export function useWishlist(status?: WishListStatus) {
  return useQuery({
    queryKey: ['finance', 'wishlist', status ?? 'ALL'],
    queryFn: async () => {
      const params = status ? `?status=${status}&size=100` : '?size=100';
      const { data } = await api.get<ApiResponse<PageResponse<WishListItemResponse>>>(`/finance/wishlist${params}`);
      return data.data.content;
    },
  });
}

export function useCreateWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: WishListItemRequest): Promise<WishListItemResponse> => {
      const { data } = await api.post<ApiResponse<WishListItemResponse>>('/finance/wishlist', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'wishlist'] });
    },
  });
}

export function useUpdateWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: WishListItemUpdateRequest }): Promise<WishListItemResponse> => {
      const { data } = await api.put<ApiResponse<WishListItemResponse>>(`/finance/wishlist/${id}`, req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'wishlist'] });
    },
  });
}

export function usePurchaseWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: PurchaseRequest }): Promise<WishListItemResponse> => {
      const { data } = await api.patch<ApiResponse<WishListItemResponse>>(`/finance/wishlist/${id}/purchase`, req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'wishlist'] });
      qc.invalidateQueries({ queryKey: ['finance', 'overview'] });
    },
  });
}

export function useCancelWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<WishListItemResponse> => {
      const { data } = await api.patch<ApiResponse<WishListItemResponse>>(`/finance/wishlist/${id}/cancel`, null);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'wishlist'] });
    },
  });
}

export function useDeleteWishlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/finance/wishlist/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['finance', 'wishlist'] });
    },
  });
}

// ── Reports ───────────────────────────────────────────────────────────────────

export function useMonthlySummary(month: string) {
  return useQuery({
    queryKey: ['finance', 'reports', 'monthly-summary', month],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MonthlySummaryResponse>>(
        `/finance/reports/monthly-summary?month=${month}`
      );
      return data.data;
    },
    enabled: !!month,
  });
}

export function useMonthlyComparison(month: string) {
  return useQuery({
    queryKey: ['finance', 'reports', 'monthly-comparison', month],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MonthlyComparisonResponse>>(
        `/finance/reports/monthly-comparison?month=${month}`
      );
      return data.data;
    },
    enabled: !!month,
  });
}

export function useCategorySummary(startDate: string, endDate: string, type: TransactionType) {
  return useQuery({
    queryKey: ['finance', 'reports', 'category-summary', startDate, endDate, type],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CategorySummaryResponse[]>>(
        `/finance/reports/category-summary?startDate=${startDate}&endDate=${endDate}&type=${type}`
      );
      return data.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useRecurrenceProjection(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['finance', 'reports', 'recurrence-projection', startDate, endDate],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RecurrenceProjectionResponse[]>>(
        `/finance/reports/recurrence-projection?startDate=${startDate}&endDate=${endDate}`
      );
      return data.data;
    },
    enabled: !!startDate && !!endDate,
  });
}
