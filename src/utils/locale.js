import lightpickrDefaults from '../core/defaults.js';

/** @type {Readonly<Record<string, string>>} */
export const DEFAULT_TRANSLATIONS = Object.freeze(_localeStringFields(lightpickrDefaults.locale));

/**
 * @param {import('./state.js').LightpickrLocale} locale
 * @param {string} field
 * @returns {string[]}
 */
export function fromLocale(locale, field) {
  const f = typeof field === 'string' ? field.trim() : '';
  const bundle = locale && typeof locale === 'object' && !Array.isArray(locale) ? locale : lightpickrDefaults.locale;
  return bundle[f] || lightpickrDefaults.locale[f];
}

/**
 * @param {import('./state.js').LightpickrLocale} locale
 * @returns {Readonly<typeof DEFAULT_TRANSLATIONS>}
 */
export function getTranslations(locale) {
  const out = Object.assign({}, DEFAULT_TRANSLATIONS);
  if (locale && typeof locale === 'object') {
    Object.assign(out, _localeStringFields(locale, Object.keys(out)));
  }
  return /** @type {Readonly<typeof DEFAULT_TRANSLATIONS>} */ (out);
}

/**
 * @private
 * @param {Record<string, unknown>} source
 * @param {readonly string[]} [onlyKeys] when set, only these keys are taken from source
 * @returns {Record<string, string>}
 */
function _localeStringFields(source, onlyKeys) {
  const keys = onlyKeys != null ? onlyKeys : Object.keys(source);
  const out = {};
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const v = source[k];
    if (typeof v === 'string' && v.trim()) {
      out[k] = v.trim();
    }
  }
  return out;
}
