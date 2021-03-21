import { utcToZonedTime, format } from 'date-fns-tz';

export const FormattedDate = (time) => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const pattern = 'MM/dd/yyyy';
  const zonedDate = utcToZonedTime(new Date(time), userTimezone);
  return format(zonedDate, pattern, { userTimezone });
};

export const FormattedTime = (time) => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const pattern = 'MM/dd/yyyy hh:mm:ss zzzz';
  const zonedDate = utcToZonedTime(new Date(time), userTimezone);
  return format(zonedDate, pattern, { userTimezone });
};