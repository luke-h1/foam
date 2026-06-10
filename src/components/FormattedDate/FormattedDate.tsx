import { format as formatter } from 'date-fns/format';
import { formatRelative } from 'date-fns/formatRelative';
import { isValid } from 'date-fns/isValid';
import { parse } from 'date-fns/parse';
import { toDate } from 'date-fns/toDate';
import { useMemo } from 'react';
import { Text } from '@app/components/ui/Text/Text';

interface Props {
  value: Date | number | string;
  format?: string;
  formatRelativeToNow?: boolean;
  testId?: string;
  parseFormat?: string;
}

export const FormattedDate = ({
  value,
  format = 'd MMMM yyyy',
  formatRelativeToNow = false,
  testId,
  parseFormat,
}: Props) => {
  const now = useMemo(() => new Date(), []);

  let parsedDate: Date;

  if (typeof value === 'string') {
    parsedDate = parseFormat
      ? parse(value, parseFormat, new Date())
      : new Date(value);
  } else {
    parsedDate = toDate(value);
  }

  if (!isValid(parsedDate)) {
    return null;
  }

  return (
    <Text data-testid={testId}>
      {formatRelativeToNow
        ? formatRelative(parsedDate, now)
        : formatter(parsedDate, format)}
    </Text>
  );
};
