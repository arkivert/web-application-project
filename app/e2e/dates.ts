// Lånedatoer for nettlesertestene, regnet fra dagens dato, så de aldri havner i fortiden. Den kjørende appen
// bruker ekte klokke. dayFromNow gir ÅÅÅÅ-MM-DD, short gir DD.MM slik appen viser datoene.
export function dayFromNow(days: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const short = (day: string) => `${day.slice(8, 10)}.${day.slice(5, 7)}`;
export const period = (startDate: string, endDate: string) => `${short(startDate)} – ${short(endDate)}`;
