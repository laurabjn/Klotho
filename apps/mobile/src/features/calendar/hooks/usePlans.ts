import type { OutfitPlan, PlanWeekInput } from '@klotho/shared';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { plansApi } from '../api/plans.api';

export const planKeys = {
  all: ['plans'] as const,
  range: (from: string, to: string) => ['plans', 'range', from, to] as const,
  note: (day: string) => ['plans', 'note', day] as const,
};

/** Plans changed: every period and the looks shown with them refresh. */
function refreshPlans(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: planKeys.all });
  void queryClient.invalidateQueries({ queryKey: ['outfits'] });
}

/** The planned looks of a period, by day. */
export function usePlans(from: string, to: string) {
  return useQuery({
    queryKey: planKeys.range(from, to),
    queryFn: () => plansApi.list(from, to),
  });
}

export function plansByDay(plans: OutfitPlan[] | undefined) {
  return new Map((plans ?? []).map((plan) => [plan.day, plan]));
}

/** "Planifier cette tenue". */
export function usePlanOutfit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ day, outfitId }: { day: string; outfitId: string }) =>
      plansApi.plan(day, outfitId),
    onSuccess: () => refreshPlans(queryClient),
  });
}

export function useRemovePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (day: string) => plansApi.remove(day),
    onSuccess: () => refreshPlans(queryClient),
  });
}

/** "Déplacer". */
export function useMovePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ day, toDay }: { day: string; toDay: string }) =>
      plansApi.move(day, toDay),
    onSuccess: () => refreshPlans(queryClient),
  });
}

/** "Changer la tenue". */
export function useRegeneratePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (day: string) => plansApi.regenerate(day),
    onSuccess: () => refreshPlans(queryClient),
  });
}

/** "Planifier ma semaine". */
export function usePlanWeek() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PlanWeekInput) => plansApi.planWeek(body),
    onSuccess: () => refreshPlans(queryClient),
  });
}

export function useDayNote(day: string) {
  return useQuery({
    queryKey: planKeys.note(day),
    queryFn: () => plansApi.note(day),
  });
}

export function useSaveDayNote(day: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => plansApi.saveNote(day, { text }),
    onSuccess: (note) => queryClient.setQueryData(planKeys.note(day), note),
  });
}
