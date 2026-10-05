import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = function() {};
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

