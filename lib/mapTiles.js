// CARTO's raster basemap CDN now requires a free API key (fair-use limit
// 5M tile requests/month) — request one at carto.com/basemaps/apikey.
// Without it, tiles still load but are watermarked "API KEY REQUIRED".
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_API_KEY;

export const CARTO_TILE_URL = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${
  CARTO_KEY ? `?key=${CARTO_KEY}` : ""
}`;

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
