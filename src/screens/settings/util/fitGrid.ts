interface FitGridOptions {
  width: number;
  targetCell: number;
  gap: number;
}

const MIN_COLUMNS = 4;

export interface GridFit {
  columns: number;
  cellSize: number;
}

export function fitGrid({ width, targetCell, gap }: FitGridOptions): GridFit {
  const columns = Math.max(
    MIN_COLUMNS,
    Math.floor((width + gap) / (targetCell + gap)),
  );

  const cellSize = Math.floor((width - gap * (columns - 1)) / columns);

  return { columns, cellSize };
}
