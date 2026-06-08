const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export function usePageHostname(configuredUrl: string): string {
  if (configuredUrl.startsWith('/')) {
    return configuredUrl;
  }

  if (typeof window === 'undefined' || LOOPBACK_HOSTS.has(window.location.hostname)) {
    return configuredUrl;
  }

  try {
    const url = new URL(configuredUrl);
    if (LOOPBACK_HOSTS.has(url.hostname)) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    // Non-HTTP schemes such as TURN are handled by the replacement below.
  }

  return configuredUrl.replace(
    /(^[a-z]+:)(localhost|127\.0\.0\.1|\[::1\])/i,
    `$1${window.location.hostname}`,
  );
}

export function currentOrigin(fallback: string): string {
  return typeof window === 'undefined' ? fallback : window.location.origin;
}
