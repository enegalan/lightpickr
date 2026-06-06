/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {string} methodName
 * @returns {void}
 */
export function invokePluginHook(instance, methodName) {
  for (let i = 0; i < instance._plugins.length; i++) {
    const fn = instance._plugins[i][methodName];
    if (typeof fn === 'function') {
      fn();
    }
  }
}

/**
 * @param {import('../core/state.js').LightpickrInstance} instance
 * @param {function} plugin
 * @returns {void}
 */
export function registerPlugin(instance, plugin) {
  if (typeof plugin !== 'function') {
    return;
  }
  const api = plugin(instance) || {};
  instance._plugins.push(api);
  if (api.onInit) {
    api.onInit();
  }
}
