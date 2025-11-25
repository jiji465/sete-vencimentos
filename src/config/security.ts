// Centralize security-related toggles and settings
// Adjust these values according to your needs.

export const ALLOW_SIGNUP = true; // Set to true to allow self-service signups

// Optional: restrict signups to these email domains (lowercase). Example: ["empresa.com"]
export const EMAIL_DOMAIN_ALLOWLIST: string[] = [];

// hCaptcha integration (public site key). When set, CAPTCHA will be required on signup
// Remember to enable CAPTCHA in Supabase Auth settings and configure the secret key there.
export const HCAPTCHA_SITE_KEY = ""; // e.g., "10000000-ffff-ffff-ffff-000000000001" (test key)

// Simple client-side rate limit for auth attempts
export const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
export const RATE_LIMIT_MAX_ATTEMPTS = 5; // Max attempts per window
