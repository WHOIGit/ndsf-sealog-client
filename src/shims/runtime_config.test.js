import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  delete globalThis.client_config;
  delete globalThis.map_tilelayers;
  vi.resetModules();
});

describe('runtime configuration adapters', () => {
  it('exports client configuration from the runtime global', async () => {
    globalThis.client_config = {
      API_ROOT_URL: 'https://example.test/sealog-server',
      DISABLE_EVENT_LOGGING: true,
    };

    const module = await import('./client_config/index.js');

    expect(module.default).toBe(globalThis.client_config);
    expect(module.API_ROOT_URL).toBe('https://example.test/sealog-server');
    expect(module.DISABLE_EVENT_LOGGING).toBe(true);
  });

  it('exports map configuration from the runtime global', async () => {
    globalThis.map_tilelayers = {
      DEFAULT_LOCATION: { lat: 41.38, lng: -71.50 },
      TILE_LAYERS: [{ name: 'Example' }],
    };

    const module = await import('./map_tilelayers/index.js');

    expect(module.default).toBe(globalThis.map_tilelayers);
    expect(module.DEFAULT_LOCATION).toEqual({ lat: 41.38, lng: -71.50 });
    expect(module.TILE_LAYERS).toEqual([{ name: 'Example' }]);
  });

  it('fails clearly when client configuration was not loaded', async () => {
    await expect(import('./client_config/index.js')).rejects.toThrow(
      'Runtime configuration "client_config" must be loaded before the application',
    );
  });

  it('fails clearly when map configuration was not loaded', async () => {
    await expect(import('./map_tilelayers/index.js')).rejects.toThrow(
      'Runtime configuration "map_tilelayers" must be loaded before the application',
    );
  });
});
