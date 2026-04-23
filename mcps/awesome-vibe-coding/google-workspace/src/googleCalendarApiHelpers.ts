// src/googleCalendarApiHelpers.ts
import { calendar_v3 } from 'googleapis';
import { UserError } from 'fastmcp';

type Calendar = calendar_v3.Calendar;
type Event = calendar_v3.Schema$Event;

/**
 * Format a Calendar API event for response
 */
export function formatEventForResponse(event: Event): any {
  return {
    id: event.id,
    summary: event.summary || '(No title)',
    description: event.description || '',
    location: event.location || '',
    start: event.start?.dateTime || event.start?.date || '',
    end: event.end?.dateTime || event.end?.date || '',
    status: event.status,
    htmlLink: event.htmlLink,
    attendees: event.attendees?.map(a => ({
      email: a.email,
      displayName: a.displayName,
      responseStatus: a.responseStatus,
      organizer: a.organizer || false
    })) || [],
    organizer: event.organizer,
    created: event.created,
    updated: event.updated,
    recurringEventId: event.recurringEventId,
  };
}

/**
 * Parse and validate date/time string
 * Supports ISO8601 formats and basic date strings
 */
export function parseDateTime(dateTimeStr: string): { dateTime?: string; date?: string } {
  if (!dateTimeStr) {
    throw new UserError('Date/time string is required');
  }

  // Check if it's a date-only format (YYYY-MM-DD)
  const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
  if (dateOnlyPattern.test(dateTimeStr)) {
    return { date: dateTimeStr };
  }

  // Otherwise, treat as dateTime (ISO8601 format expected)
  // The Google Calendar API expects RFC3339 format
  try {
    // Basic validation - try to parse as Date
    const parsed = new Date(dateTimeStr);
    if (isNaN(parsed.getTime())) {
      throw new Error('Invalid date');
    }
    return { dateTime: dateTimeStr };
  } catch (error) {
    throw new UserError(
      `Invalid date/time format: ${dateTimeStr}. ` +
      `Use ISO8601 format (e.g., "2026-02-14T14:00:00-08:00") or date-only (e.g., "2026-02-14")`
    );
  }
}

/**
 * Build event resource for Calendar API
 */
export function buildEventResource(params: {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  location?: string;
  attendees?: string[];
  timeZone?: string;
}): Event {
  const start: any = parseDateTime(params.startDateTime);
  const end: any = parseDateTime(params.endDateTime);

  if (params.timeZone) {
    if (start.dateTime) start.timeZone = params.timeZone;
    if (end.dateTime) end.timeZone = params.timeZone;
  }

  const event: Event = {
    summary: params.summary,
    description: params.description,
    location: params.location,
    start: start,
    end: end,
  };

  // Add attendees if provided
  if (params.attendees && params.attendees.length > 0) {
    event.attendees = params.attendees.map(email => ({ email }));
  }

  return event;
}

/**
 * Validate calendarId
 */
export function validateCalendarId(calendarId: string): string {
  if (!calendarId) {
    return 'primary';
  }
  return calendarId;
}

/**
 * Format time bounds for list queries
 */
export function formatTimeBounds(timeMin?: string, timeMax?: string): {
  timeMin?: string;
  timeMax?: string;
} {
  const result: { timeMin?: string; timeMax?: string } = {};

  if (timeMin) {
    try {
      const parsed = new Date(timeMin);
      if (!isNaN(parsed.getTime())) {
        result.timeMin = parsed.toISOString();
      }
    } catch (error) {
      throw new UserError(`Invalid timeMin format: ${timeMin}. Use ISO8601 format.`);
    }
  }

  if (timeMax) {
    try {
      const parsed = new Date(timeMax);
      if (!isNaN(parsed.getTime())) {
        result.timeMax = parsed.toISOString();
      }
    } catch (error) {
      throw new UserError(`Invalid timeMax format: ${timeMax}. Use ISO8601 format.`);
    }
  }

  return result;
}

/**
 * Merge event updates with existing event
 */
export function mergeEventUpdates(existingEvent: Event, updates: Partial<Event>): Event {
  const merged: Event = { ...existingEvent };

  if (updates.summary !== undefined) {
    merged.summary = updates.summary;
  }

  if (updates.description !== undefined) {
    merged.description = updates.description;
  }

  if (updates.location !== undefined) {
    merged.location = updates.location;
  }

  if (updates.start !== undefined) {
    merged.start = updates.start;
  }

  if (updates.end !== undefined) {
    merged.end = updates.end;
  }

  if (updates.attendees !== undefined) {
    merged.attendees = updates.attendees;
  }

  return merged;
}
