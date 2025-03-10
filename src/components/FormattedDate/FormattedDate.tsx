import {
  format as formatter,
  formatRelative,
  isValid,
  parse,
  toDate,
} from 'date-fns';
import { Typography } from '../Typography';

interface Props {
  children: Date | number | string;
  format?: string;
  formatRelativeToNow?: boolean;
  testId?: string;
  parseFormat?: string;
}

export function FormattedDate({
  children,
  format = 'd MMMM yyyy',
  formatRelativeToNow = false,
  testId,
  parseFormat,
}: Props) {
  let parsedDate: Date;

  if (typeof children === 'string') {
    parsedDate = parseFormat
      ? parse(children, parseFormat, new Date())
      : new Date(children);
  } else {
    parsedDate = toDate(children);
  }

  if (!isValid(parsedDate)) {
    return null;
  }

  return (
    <Typography data-testid={testId}>
      {formatRelativeToNow
        ? formatRelative(parsedDate, new Date())
        : formatter(parsedDate, format)}
    </Typography>
  );
}
