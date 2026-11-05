// Approximate typical effective income tax for a middle-income self-employed person.
// These are estimates for planning, not tax advice. Users can change them in Settings.
const RATES: Record<string, number> = {
  Nigeria: 15, Ghana: 20, Kenya: 25, 'South Africa': 25, Egypt: 20, Morocco: 25, Tanzania: 20, Uganda: 20, Ethiopia: 20,
  'United States': 25, Canada: 25, Mexico: 20, Brazil: 20, Argentina: 25, Chile: 20, Colombia: 20,
  'United Kingdom': 25, Ireland: 25, Germany: 30, France: 30, Spain: 25, Italy: 30, Netherlands: 30, Belgium: 35,
  Portugal: 25, Switzerland: 20, Austria: 30, Sweden: 30, Norway: 30, Denmark: 35, Finland: 30, Poland: 18,
  Czechia: 15, Greece: 25, Turkey: 25, Türkiye: 25, Russia: 13, Ukraine: 19, Israel: 25,
  India: 15, Pakistan: 15, Bangladesh: 15, China: 15, Japan: 20, 'South Korea': 20, Indonesia: 15, Philippines: 20,
  Vietnam: 20, Thailand: 15, Malaysia: 15, Singapore: 10, Australia: 25, 'New Zealand': 25,
  'Saudi Arabia': 0, 'United Arab Emirates': 0, Qatar: 0, Bahrain: 0, Kuwait: 0, Oman: 0,
};
export const DEFAULT_RATE = 20;
export const hasRate = (country?: string) => !!country && country in RATES;
export const taxFor = (country?: string) => (country && RATES[country] !== undefined ? RATES[country] : DEFAULT_RATE);
