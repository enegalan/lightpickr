import lightpickrDefaults from '../core/defaults.js';

/** @type {Readonly<Record<string, string>>} */
export const DEFAULT_TRANSLATIONS = Object.freeze(_localeStringFields(lightpickrDefaults.locale));

/**
 * @param {import('./state.js').LightpickrLocale} locale
 * @param {string} [monthsField]
 * @returns {string[]}
 */
export function defaultMonthNames(locale, monthsField) {
    const field = typeof monthsField === 'string' && monthsField.trim() ? monthsField.trim() : lightpickrDefaults.monthsField;
    return (Array.isArray(locale) ? locale : locale || lightpickrDefaults.locale)[field] || lightpickrDefaults.locale[field];
}

/**
 * @param {import('./state.js').LightpickrLocale} locale
 * @param {string} [weekdaysField]
 * @returns {string[]}
 */
export function defaultWeekdayNames(locale, weekdaysField) {
    const field = typeof weekdaysField === 'string' && weekdaysField.trim() ? weekdaysField.trim() : lightpickrDefaults.weekdaysField;
    return (Array.isArray(locale) ? locale : locale || lightpickrDefaults.locale)[field] || lightpickrDefaults.locale[field];
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
