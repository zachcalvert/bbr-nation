import { utcToZonedTime, format } from 'date-fns-tz';

export const FormattedTime = (time) => {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const pattern = 'MM/dd/yyyy';
  const zonedDate = utcToZonedTime(new Date(time), userTimezone);
  return format(zonedDate, pattern, { userTimezone });
};