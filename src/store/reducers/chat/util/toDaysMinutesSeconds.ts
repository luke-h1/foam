export default function toDaysMinutesSeconds(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor(seconds / 60) % 60;
  const s = seconds % 60;

  return [h ? `${h}h` : null, m ? `${m}m` : null, s ? `${s}s` : null]
    .filter(Boolean)
    .join(' ');
}
