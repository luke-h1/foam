import { fitGrid } from '../fit-grid';

describe('fitGrid', () => {
  test('fits more columns on a wider screen', () => {
    expect(fitGrid({ width: 408, targetCell: 56, gap: 4 })).toEqual({
      columns: 6,
      cellSize: 64,
    });
    expect(fitGrid({ width: 988, targetCell: 56, gap: 4 })).toEqual({
      columns: 16,
      cellSize: 58,
    });
  });

  test('stretches cells so a row fills the width', () => {
    const { columns, cellSize } = fitGrid({
      width: 360,
      targetCell: 56,
      gap: 4,
    });

    expect(columns * cellSize + (columns - 1) * 4).toBeLessThanOrEqual(360);
    expect(columns * cellSize + (columns - 1) * 4).toBeGreaterThan(
      360 - columns,
    );
  });

  test('never drops below the minimum column count', () => {
    expect(fitGrid({ width: 120, targetCell: 56, gap: 4 }).columns).toEqual(4);
  });
});
