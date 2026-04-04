import lightpickrDefaults from '../core/defaults.js';

/** @type {Readonly<Record<string, string>>} */
export const DEFAULT_TRANSLATIONS = Object.freeze(_localeStringFields(lightpickrDefaults.locale));

/**
 * @param {import('./state.js').LightpickrOptions|import('./state.js').LightpickrInternalState} opts
 * @param {string} [monthsField]
 * @returns {string[]}
 */
export function defaultMonthNames(opts, monthsField) {
    const field = typeof monthsField === 'string' && monthsField.trim() ? monthsField.trim() : lightpickrDefaults.monthsField;
    if (opts.locale && typeof opts.locale === 'object') {
        const locale = opts.locale;
        if (Array.isArray(locale[field]) && locale[field].length === 12) {
            return locale[field];
        }
    }
    return defaultMonthNames({ locale: lightpickrDefaults.locale }, monthsField);
}

/**
 * @param {import('./state.js').LightpickrOptions} opts
 * @param {boolean} longNames
 * @returns {string[]}
 */
export function defaultWeekdayNames(opts, longNames = false) {
    const field = longNames ? 'weekdaysLong' : 'weekdaysShort';
    if (opts.locale && typeof opts.locale === 'object' && Array.isArray(opts.locale[field]) && opts.locale[field].length === 7) {
        return opts.locale[field];
    }
    return defaultWeekdayNames({ locale: lightpickrDefaults.locale }, longNames);
}

/**
 * @param {import('./state.js').LightpickrOptions|import('./state.js').LightpickrInternalState} opts
 * @returns {Readonly<typeof DEFAULT_TRANSLATIONS>}
 */
export function getTranslations(opts) {
    const out = Object.assign({}, DEFAULT_TRANSLATIONS);
    const loc = opts && opts.locale;
    if (loc && typeof loc === 'object') {
        Object.assign(out, _localeStringFields(loc, Object.keys(out)));
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
