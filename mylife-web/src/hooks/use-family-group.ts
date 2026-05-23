'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  ApiResponse,
  FamilyGroupResponse,
  FamilyGroupRequest,
  AddMemberRequest,
} from '@/types/api';

const QK = ['family-group', 'me'] as const;

export function useMyFamilyGroup() {
  return useQuery({
    queryKey: QK,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FamilyGroupResponse | null>>('/family-groups/me');
      return data.data;
    },
  });
}

export function useCreateFamilyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: FamilyGroupRequest): Promise<FamilyGroupResponse> => {
      const { data } = await api.post<ApiResponse<FamilyGroupResponse>>('/family-groups', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
    },
  });
}

export function useUpdateFamilyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: FamilyGroupRequest }): Promise<FamilyGroupResponse> => {
      const { data } = await api.put<ApiResponse<FamilyGroupResponse>>(`/family-groups/${id}`, req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
    },
  });
}

export function useDeleteFamilyGroup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/family-groups/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
    },
  });
}

export function useAddFamilyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, req }: { groupId: number; req: AddMemberRequest }): Promise<FamilyGroupResponse> => {
      const { data } = await api.post<ApiResponse<FamilyGroupResponse>>(`/family-groups/${groupId}/members`, req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
    },
  });
}

export function useRemoveFamilyMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: number; userId: number }): Promise<FamilyGroupResponse> => {
      const { data } = await api.delete<ApiResponse<FamilyGroupResponse>>(`/family-groups/${groupId}/members/${userId}`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK });
    },
  });
}
