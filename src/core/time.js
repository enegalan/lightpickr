/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} hours
 * @param {number} minutes
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function setTimePart(state, hours, minutes) {
  const next = Object.assign({}, state);
  const h = Math.max(0, Math.min(23, Math.floor(hours)));
  const m = Math.max(0, Math.min(59, Math.floor(minutes)));
  next.timePart = { hours: h, minutes: m };
  return next;
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} deltaHours
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function bumpHours(state, deltaHours) {
  let h = state.timePart.hours + deltaHours;
  while (h < 0) {
    h += 24;
  }
  while (h > 23) {
    h -= 24;
  }
  return setTimePart(state, h, state.timePart.minutes);
}

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} deltaMinutes
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function bumpMinutes(state, deltaMinutes) {
  let total = state.timePart.hours * 60 + state.timePart.minutes + deltaMinutes;
  while (total < 0) {
    total += 24 * 60;
  }
  while (total >= 24 * 60) {
    total -= 24 * 60;
  }
  const h = Math.floor(total / 60);
  const m = total % 60;
  return setTimePart(state, h, m);
}
