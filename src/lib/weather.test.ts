import { describe, expect, it } from 'vitest';
import { buildWeatherRequest, isValidZip, normalizeZip, parseWeatherReport } from './weather';

describe('weather', () => {
  it('validates zips', () => {
    expect(isValidZip('30301')).toBe(true);
    expect(isValidZip('30301-1234')).toBe(true);
    expect(isValidZip('3030')).toBe(false);
    expect(isValidZip('abcde')).toBe(false);
  });

  it('normalises zips', () => {
    expect(normalizeZip(' 30301 ')).toBe('30301');
    expect(normalizeZip('303011234')).toBe('30301-1234');
    expect(normalizeZip('3030a1')).toBe('30301');
  });

  it('builds the request (bare zip by default)', () => {
    expect(buildWeatherRequest('30301')).toBe('30301');
    expect(buildWeatherRequest('30301', 'wx {zip}')).toBe('wx 30301');
    expect(buildWeatherRequest('30301', 'weather')).toBe('weather 30301');
    expect(buildWeatherRequest('30301', '  ')).toBe('30301');
  });

  it('parses free-form replies', () => {
    const r = parseWeatherReport('Atlanta 30301: 72.4F Partly Cloudy, wind SW 5mph');
    expect(r.temp).toBe('72°F');
    expect(r.condition).toBe('Partly Cloudy');
    expect(r.icon).toBe('cloud');
    expect(parseWeatherReport('Breezy, gusts 30mph').icon).toBe('wind');
    expect(parseWeatherReport('Thunderstorms likely, 81°F').icon).toBe('storm');
    expect(parseWeatherReport('hello').temp).toBeUndefined();
  });
});
