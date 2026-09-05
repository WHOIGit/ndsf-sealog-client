const config = globalThis.map_tilelayers;
if (!config || typeof config !== 'object') {
  throw new Error(
    'Runtime configuration "map_tilelayers" must be loaded before the application',
  );
}

export const { DEFAULT_LOCATION, TILE_LAYERS } = config;
export default config;
