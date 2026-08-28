const { test, expect } = require('@playwright/test');
const {
  edsUnavailableMessage,
  isEdsUnavailable,
} = require('../utils/availability.js');

test.describe('EDS availability checks', () => {
  test('treats HTTP 404 as unavailable', () => {
    const load = {
      requestedUrl: 'https://example.com/missing',
      finalUrl: 'https://example.com/missing',
      status: 404,
      ok: false,
      error: null,
    };
    expect(isEdsUnavailable(load)).toBe(true);
    expect(edsUnavailableMessage(load)).toBe('EDS page not found (404)');
  });

  test('treats HTTP 410 as unavailable', () => {
    const load = {
      status: 410,
      ok: false,
      error: null,
    };
    expect(isEdsUnavailable(load)).toBe(true);
    expect(edsUnavailableMessage(load)).toBe('EDS page removed (410)');
  });

  test('allows successful EDS responses', () => {
    const load = {
      status: 200,
      ok: true,
      error: null,
    };
    expect(isEdsUnavailable(load)).toBe(false);
  });

  test('treats navigation errors as unavailable', () => {
    const load = {
      status: null,
      ok: false,
      error: 'Timeout',
    };
    expect(isEdsUnavailable(load)).toBe(true);
    expect(edsUnavailableMessage(load)).toBe('EDS page unavailable (Timeout)');
  });
});
