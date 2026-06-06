type CharityCurrencyFormat = {
  position: 'prefix' | 'suffix';
  symbol: string;
};

const CHARITY_CURRENCY_FORMATS: Record<string, CharityCurrencyFormat> = {
  AUD: { position: 'prefix', symbol: 'A$' },
  BRL: { position: 'prefix', symbol: 'R$' },
  CAD: { position: 'prefix', symbol: 'CA$' },
  CHF: { position: 'prefix', symbol: 'CHF ' },
  DKK: { position: 'suffix', symbol: ' kr' },
  EUR: { position: 'prefix', symbol: '€' },
  GBP: { position: 'prefix', symbol: '£' },
  JPY: { position: 'prefix', symbol: '¥' },
  MXN: { position: 'prefix', symbol: 'MX$' },
  NOK: { position: 'suffix', symbol: ' kr' },
  NZD: { position: 'prefix', symbol: 'NZ$' },
  PLN: { position: 'suffix', symbol: ' zł' },
  SEK: { position: 'suffix', symbol: ' kr' },
  USD: { position: 'prefix', symbol: '$' },
};

export function formatCharityAmount(
  amountRaw: string,
  exponentRaw: string,
  currency: string,
): string {
  const amount = Number.parseInt(amountRaw || '0', 10) || 0;
  const exponent = Number.parseInt(exponentRaw || '2', 10) || 0;
  const currencyCode = (currency || 'USD').trim().toUpperCase() || 'USD';
  const value = amount / 10 ** Math.max(0, exponent);
  const formattedNumber = value.toFixed(Math.max(0, exponent));
  const format = CHARITY_CURRENCY_FORMATS[currencyCode];

  if (!format) {
    return `${formattedNumber} ${currencyCode}`;
  }

  return format.position === 'prefix'
    ? `${format.symbol}${formattedNumber}`
    : `${formattedNumber}${format.symbol}`;
}
