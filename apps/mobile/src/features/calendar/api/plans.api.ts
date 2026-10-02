import type {
  DayNote,
  DayNoteInput,
  OutfitPlan,
  PlanWeekInput,
} from '@klotho/shared';

import { request } from '@/lib/api/http';

export const plansApi = {
  /** The planned looks of a period, days included (YYYY-MM-DD). */
  list: (from: string, to: string) =>
    request<OutfitPlan[]>(`/plans?from=${from}&to=${to}`, { auth: true }),
  /** "Planifier cette tenue": replaces the day's plan. */
  plan: (day: string, outfitId: string) =>
    request<OutfitPlan>(`/plans/${day}`, {
      method: 'PUT',
      body: { outfitId },
      auth: true,
    }),
  remove: (day: string) =>
    request<void>(`/plans/${day}`, { method: 'DELETE', auth: true }),
  /** "Déplacer": a plan already on the target day is swapped. */
  move: (day: string, toDay: string) =>
    request<OutfitPlan[]>(`/plans/${day}/move`, {
      method: 'POST',
      body: { toDay },
      auth: true,
    }),
  /** "Changer la tenue": a new look for that day. */
  regenerate: (day: string) =>
    request<OutfitPlan>(`/plans/${day}/regenerate`, {
      method: 'POST',
      auth: true,
    }),
  /** "Planifier ma semaine": the newly planned days. */
  planWeek: (body: PlanWeekInput) =>
    request<OutfitPlan[]>('/plans/week', { method: 'POST', body, auth: true }),
  note: (day: string) => request<DayNote>(`/days/${day}/note`, { auth: true }),
  saveNote: (day: string, body: DayNoteInput) =>
    request<DayNote>(`/days/${day}/note`, {
      method: 'PUT',
      body,
      auth: true,
    }),
};
