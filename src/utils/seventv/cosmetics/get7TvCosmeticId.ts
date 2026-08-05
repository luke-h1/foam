const ZERO_ID = '00000000000000000000000000';

export function get7TvCosmeticId(
  data: { id: string } & { ref_id?: string },
): string {
  return data.id === ZERO_ID && data.ref_id ? data.ref_id : data.id;
}
