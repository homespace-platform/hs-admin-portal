// Pure helpers for the standalone /kyc page. No imports on purpose: unit-tested directly from node.

/** Where the admin lands when `returnTo` is missing or unsafe. */
export const DEFAULT_RETURN_TO = "/settings/account-security";
const MAX_RETURN_TO_LENGTH = 300;
const KYC_PATH = "/kyc";

// Control characters (incl. CR/LF/TAB, which URL parsers silently strip) and backslashes.
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const FORBIDDEN = /[\u0000-\u001f\u007f\\]/;

function isSafePath(value: string, allowKyc = false): boolean {
  if (!value.startsWith("/") || value.startsWith("//") || FORBIDDEN.test(value)) return false;
  try {
    // Same-origin check against a throwaway base: a path must never resolve elsewhere.
    const url = new URL(value, "http://same-origin.invalid");
    if (url.origin !== "http://same-origin.invalid") return false;
    // `returnTo` must never bounce back into the KYC page itself (redirect loop); a LOGIN return may be /kyc.
    return allowKyc || (url.pathname !== KYC_PATH && !url.pathname.startsWith(`${KYC_PATH}/`));
  } catch {
    return false;
  }
}

/**
 * Accepts only a same-origin relative path (one leading `/`, no `//`, no `\`, no scheme, no control chars).
 * The value is also decoded once and re-checked, so `%2F%2Fevil.com` / `%5Cevil` cannot sneak through.
 */
export function safeReturnTo(raw: unknown, fallback: string = DEFAULT_RETURN_TO, allowKyc = false): string {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_RETURN_TO_LENGTH) return fallback;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  return isSafePath(raw, allowKyc) && isSafePath(decoded, allowKyc) ? raw : fallback;
}

export function parseKycParams(search: string | URLSearchParams): { returnTo: string } {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  // getAll: repeated `returnTo` params are ambiguous, so they fall back instead of picking one.
  const values = params.getAll("returnTo");
  return { returnTo: safeReturnTo(values.length === 1 ? values[0] : undefined) };
}

/** `/kyc?returnTo=<encoded safe path>` */
export function kycUrl(returnTo: string): string {
  return `${KYC_PATH}?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`;
}

/** Settings path to come back to: the current /settings/* page, else the account & security page. */
export function settingsReturnTo(pathname: string, search = ""): string {
  return safeReturnTo(pathname.startsWith("/settings/") ? pathname + search : DEFAULT_RETURN_TO);
}
