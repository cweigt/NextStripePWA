import { addDays, addMonths, addWeeks, addYears, format } from 'date-fns';

export interface RecurringEventPayload {
  title: string;
  startISO: string;
  createdAt: string;
  recurring: boolean;
  recurrenceType: string;
  recurrenceEndDate: string;
  parentEventId: string;
  isRecurringInstance: boolean;
}

export function generateRecurring(
  title: string,
  startDate: Date,
  recurrenceType: string,
  endDate: Date,
): Array<{ date: Date; dateKey: string; payload: RecurringEventPayload }> {
  const events: Array<{ date: Date; dateKey: string; payload: RecurringEventPayload }> = [];
  const parentId = `parent_${Date.now()}`;
  let current = startDate;

  while (current <= endDate) {
    events.push({
      date: current,
      dateKey: format(current, 'yyyy-MM-dd'),
      payload: {
        title,
        startISO: current.toISOString(),
        createdAt: new Date().toISOString(),
        recurring: true,
        recurrenceType,
        recurrenceEndDate: endDate.toISOString(),
        parentEventId: parentId,
        isRecurringInstance: events.length > 0,
      },
    });

    switch (recurrenceType) {
      case 'daily':   current = addDays(current, 1);   break;
      case 'weekly':  current = addWeeks(current, 1);  break;
      case 'monthly': current = addMonths(current, 1); break;
      case 'yearly':  current = addYears(current, 1);  break;
      default:        current = new Date(endDate.getTime() + 1);
    }
  }

  return events;
}
