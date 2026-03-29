import { clampToStep } from './utils.js';

/**
 * @param {import('./state.js').LightpickrInternalState} state
 * @param {number} hours
 * @param {number} minutes
 * @returns {import('./state.js').LightpickrInternalState}
 */
export function setTimePart(state, hours, minutes) {
  const next = Object.assign({}, state);
  const h = clampToStep(hours, state.minHours, state.maxHours, state.hoursStep);
  const m = clampToStep(minutes, state.minMinutes, state.maxMinutes, state.minutesStep);
  next.timePart = { hours: h, minutes: m };
  return next;
}

