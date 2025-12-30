function uniq(arr) {
  return Array.from(new Set(arr));
}

export function getAmapScriptUrl({ amapKey, plugins = [] }) {
  if (!amapKey) {
    throw new Error('amapKey is required');
  }

  const base = `https://webapi.amap.com/maps?v=2.0&key=${encodeURIComponent(amapKey)}`;
  const normalizedPlugins = uniq(plugins).filter(Boolean);

  if (normalizedPlugins.length === 0) return base;

  return `${base}&plugin=${encodeURIComponent(normalizedPlugins.join(','))}`;
}

export function loadAmapScript({ amapKey, amapSecurityCode, plugins = [] } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('loadAmapScript can only run in the browser'));
      return;
    }

    if (window.AMap) {
      resolve(window.AMap);
      return;
    }

    window._AMapSecurityConfig = {
      securityJsCode: amapSecurityCode || ''
    };

    const url = getAmapScriptUrl({ amapKey, plugins });
    const script = document.createElement('script');
    script.src = url;
    script.async = true;

    script.onload = () => {
      if (!window.AMap) {
        reject(new Error('AMap loaded but window.AMap is missing'));
        return;
      }
      resolve(window.AMap);
    };

    script.onerror = () => {
      reject(new Error('AMap script failed to load'));
    };

    document.head.appendChild(script);
  });
}
