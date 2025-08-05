import {
  format as formatter,
  formatRelative,
  isValid,
  parse,
  toDate,
} from 'date-fns';
import { Text } from '../Text';

interface Props {
  children: Date | number | string;
  format?: string;
  formatRelativeToNow?: boolean;
  testId?: string;
  parseFormat?: string;
}

export const FormattedDate = ({
  children,
  format = 'd MMMM yyyy',
  formatRelativeToNow = false,
  testId,
  parseFormat,
}: Props) => {
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
    <Text data-testid={testId} variant="caption2">
      {formatRelativeToNow
        ? formatRelative(parsedDate, new Date())
        : formatter(parsedDate, format)}
    </Text>
  );
};
