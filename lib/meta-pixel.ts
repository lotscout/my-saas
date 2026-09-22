type MetaPixelEventParams = Record<string, string | number | boolean | string[] | number[] | null | undefined>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaEvent(eventName: string, params?: MetaPixelEventParams) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('track', eventName, cleanParams(params));
}

export function trackMetaCustomEvent(eventName: string, params?: MetaPixelEventParams) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  window.fbq('trackCustom', eventName, cleanParams(params));
}

function cleanParams(params?: MetaPixelEventParams) {
  if (!params) return undefined;
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null));
}
