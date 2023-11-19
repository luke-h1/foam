export default function viewFormatter(num: number, digits: number) {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'K' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];

  const regex = /\.0+$|(\.[0-9]*[1-9])0+$/;

  const item = lookup
    .slice()
    .reverse()
    // eslint-disable-next-line no-shadow
    .find(item => {
      return num >= item.value;
    });

  return item
    ? (num / item.value).toFixed(digits).replace(regex, '$1') + item.symbol
    : '0';
}
