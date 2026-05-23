'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  ApiResponse,
  PageResponse,
  FitProfileResponse,
  FitProfileRequest,
  BodyMeasurementResponse,
  BodyMeasurementRequest,
  WorkoutResponse,
  WorkoutRequest,
  WorkoutUpdateRequest,
  WorkoutExerciseResponse,
  WorkoutExerciseRequest,
  WorkoutSummaryResponse,
  WorkoutType,
  WorkoutStatus,
} from '@/types/api';

// ── Profile ───────────────────────────────────────────────────────────────────

export function useFitProfile() {
  return useQuery({
    queryKey: ['fit', 'profile'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FitProfileResponse>>('/fit/profile');
      return data.data;
    },
  });
}

export function useUpsertFitProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: FitProfileRequest) => {
      const { data } = await api.put<ApiResponse<FitProfileResponse>>('/fit/profile', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fit', 'profile'] });
    },
  });
}

// ── Measurements ──────────────────────────────────────────────────────────────

export function useBodyMeasurements(page = 0, size = 20) {
  return useQuery({
    queryKey: ['fit', 'measurements', page],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PageResponse<BodyMeasurementResponse>>>(
        `/fit/measurements?page=${page}&size=${size}&sort=date,desc`
      );
      return data.data;
    },
  });
}

export function useCreateMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: BodyMeasurementRequest) => {
      const { data } = await api.post<ApiResponse<BodyMeasurementResponse>>('/fit/measurements', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fit', 'measurements'] });
      qc.invalidateQueries({ queryKey: ['fit', 'profile'] });
    },
  });
}

export function useDeleteMeasurement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/fit/measurements/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fit', 'measurements'] });
    },
  });
}

// ── Workouts ──────────────────────────────────────────────────────────────────

interface WorkoutFilters {
  type?: WorkoutType;
  status?: WorkoutStatus;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}

export function useWorkouts(filters: WorkoutFilters = {}) {
  const { type, status, from, to, page = 0, size = 20 } = filters;
  return useQuery({
    queryKey: ['fit', 'workouts', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('size', String(size));
      params.set('sort', 'date,desc');
      if (type)   params.set('type', type);
      if (status) params.set('status', status);
      if (from)   params.set('from', from);
      if (to)     params.set('to', to);
      const { data } = await api.get<ApiResponse<PageResponse<WorkoutResponse>>>(
        `/fit/workouts?${params.toString()}`
      );
      return data.data;
    },
  });
}

export function useWorkout(id: number | null) {
  return useQuery({
    queryKey: ['fit', 'workouts', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WorkoutResponse>>(`/fit/workouts/${id}`);
      return data.data;
    },
    enabled: id !== null,
  });
}

export function useWorkoutSummary() {
  return useQuery({
    queryKey: ['fit', 'workouts', 'summary'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WorkoutSummaryResponse>>('/fit/workouts/summary');
      return data.data;
    },
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: WorkoutRequest) => {
      const { data } = await api.post<ApiResponse<WorkoutResponse>>('/fit/workouts', req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fit', 'workouts'] });
    },
  });
}

export function useUpdateWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, req }: { id: number; req: WorkoutUpdateRequest }) => {
      const { data } = await api.put<ApiResponse<WorkoutResponse>>(`/fit/workouts/${id}`, req);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fit', 'workouts'] });
    },
  });
}

export function useCompleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<ApiResponse<WorkoutResponse>>(`/fit/workouts/${id}/complete`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fit', 'workouts'] });
    },
  });
}

export function useSkipWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.patch<ApiResponse<WorkoutResponse>>(`/fit/workouts/${id}/skip`);
      return data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fit', 'workouts'] });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/fit/workouts/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fit', 'workouts'] });
    },
  });
}

// ── Exercises ─────────────────────────────────────────────────────────────────

export function useAddExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutId, req }: { workoutId: number; req: WorkoutExerciseRequest }) => {
      const { data } = await api.post<ApiResponse<WorkoutExerciseResponse>>(
        `/fit/workouts/${workoutId}/exercises`, req
      );
      return data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['fit', 'workouts', vars.workoutId] });
      qc.invalidateQueries({ queryKey: ['fit', 'workouts'] });
    },
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      workoutId, exerciseId, req,
    }: { workoutId: number; exerciseId: number; req: WorkoutExerciseRequest }) => {
      const { data } = await api.put<ApiResponse<WorkoutExerciseResponse>>(
        `/fit/workouts/${workoutId}/exercises/${exerciseId}`, req
      );
      return data.data;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['fit', 'workouts', vars.workoutId] });
    },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ workoutId, exerciseId }: { workoutId: number; exerciseId: number }) => {
      await api.delete(`/fit/workouts/${workoutId}/exercises/${exerciseId}`);
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['fit', 'workouts', vars.workoutId] });
      qc.invalidateQueries({ queryKey: ['fit', 'workouts'] });
    },
  });
}
