// Utility for company identification in multi-tenant setup

// Domain to use for API requests - in production uses actual hostname, in dev uses configured domain
const CONFIGURED_DOMAIN = process.env.NEXT_PUBLIC_DOMAIN;

/**
 * Check if we're in development mode (localhost)
 */
export function isDevelopment(): boolean {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    return hostname.includes('localhost') || hostname.includes('127.0.0.1');
  }
  return true; // Assume development for SSR
}

/**
 * Get domain for API requests.
 * Uses NEXT_PUBLIC_DOMAIN if set, otherwise falls back to window.location.hostname
 */
export function getDomain(): string | undefined {
  // Always use configured domain if set (gives full control via env)
  if (CONFIGURED_DOMAIN) {
    return CONFIGURED_DOMAIN;
  }
  // Fall back to hostname in production
  if (typeof window !== 'undefined' && !isDevelopment()) {
    return window.location.hostname;
  }
  return undefined;
}

/**
 * Get domain params for public API requests.
 */
export function getDomainParams(): Record<string, string> {
  const domain = getDomain();
  if (domain) {
    return { domain };
  }
  return {};
}

/**
 * Get the current domain (for display purposes)
 */
export function getCurrentDomain(): string | null {
  return getDomain() || null;
}

/**
 * Check if we're in production (using domain) or development (using company ID)
 */
export function isProductionMode(): boolean {
  return !isDevelopment();
}
