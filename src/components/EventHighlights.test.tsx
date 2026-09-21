import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { 
  EventHighlights, 
  DEFAULT_EVENT_HIGHLIGHTS,
  getStoredHighlights,
  saveStoredHighlights,
  EVENT_HIGHLIGHTS_STORAGE_KEY
} from './EventHighlights';
import { EventHighlight } from '../types';

const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe('EventHighlights Component & Gallery System', () => {
  beforeAll(() => {
    if (typeof globalThis.localStorage === 'undefined' || !globalThis.localStorage.setItem) {
      (globalThis as any).localStorage = createLocalStorageMock();
    }
  });

  beforeEach(() => {
    try {
      localStorage.clear();
    } catch {}
  });

  it('renders EventHighlights section with default highlights without crashing', () => {
    const html = renderToString(React.createElement(EventHighlights));
    expect(html).toBeTruthy();
    expect(html).toContain('Event Highlights &amp; Gallery');
    expect(html).toContain('LOOP ACTIVE');
    expect(html).toContain(DEFAULT_EVENT_HIGHLIGHTS[0].title);
  });

  it('renders admin upload buttons when admin is logged in', () => {
    const html = renderToString(React.createElement(EventHighlights, {
      isAdminLoggedIn: true,
    }));
    expect(html).toContain('Upload Photo');
    expect(html).toContain('Change Image');
  });

  it('retrieves default event highlights when storage is empty', () => {
    const highlights = getStoredHighlights();
    expect(highlights).toHaveLength(DEFAULT_EVENT_HIGHLIGHTS.length);
    expect(highlights[0].title).toBe(DEFAULT_EVENT_HIGHLIGHTS[0].title);
  });

  it('allows saving, updating, and removing custom event highlights', () => {
    const customHighlight: EventHighlight = {
      id: 'hl-custom-1',
      title: 'Tournament Opening Fireworks Over Center Court',
      caption: 'Spectacular pyrotechnic show marks the commencement of the 2026 collegiate championship.',
      imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      tag: 'Ceremony',
      date: 'Opening Ceremony',
    };

    saveStoredHighlights([customHighlight]);
    const stored = getStoredHighlights();
    expect(stored).toHaveLength(1);
    expect(stored[0].title).toBe('Tournament Opening Fireworks Over Center Court');
    expect(stored[0].imageUrl).toContain('data:image/png');

    // Update photo
    stored[0].title = 'Grand Finale Trophy Celebration';
    stored[0].imageUrl = 'https://example.com/trophy.jpg';
    saveStoredHighlights(stored);

    const updated = getStoredHighlights();
    expect(updated[0].title).toBe('Grand Finale Trophy Celebration');
    expect(updated[0].imageUrl).toBe('https://example.com/trophy.jpg');

    // Remove photo
    saveStoredHighlights([]);
    // When empty array in storage, getStoredHighlights returns DEFAULT_EVENT_HIGHLIGHTS
    expect(getStoredHighlights()).toHaveLength(DEFAULT_EVENT_HIGHLIGHTS.length);
  });
});

