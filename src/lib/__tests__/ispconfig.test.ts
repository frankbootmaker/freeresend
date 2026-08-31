/**
 * @jest-environment node
 */

import {
  ispconfigZoneCandidates,
  normalizeIspconfigApiUrl,
} from '../ispconfig';

describe('normalizeIspconfigApiUrl', () => {
  it('appends /remote/json.php when only the panel origin is given', () => {
    expect(normalizeIspconfigApiUrl('https://panel.example.com:8080')).toBe(
      'https://panel.example.com:8080/remote/json.php',
    );
    expect(
      normalizeIspconfigApiUrl('https://panel.example.com:8080/remote/json.php/'),
    ).toBe('https://panel.example.com:8080/remote/json.php');
  });
});

describe('ispconfigZoneCandidates', () => {
  it('walks from host to apex with trailing dots', () => {
    expect(ispconfigZoneCandidates('smtp.mail.example.com')).toEqual([
      'smtp.mail.example.com.',
      'mail.example.com.',
      'example.com.',
    ]);
  });
});
