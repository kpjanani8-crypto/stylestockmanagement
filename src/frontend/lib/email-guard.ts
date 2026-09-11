// Blocks fake / disposable / test email addresses so only real inboxes can register.

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "yopmail.com", "guerrillamail.com", "sharklasers.com",
  "10minutemail.com", "tempmail.com", "temp-mail.org", "trashmail.com",
  "getnada.com", "dispostable.com", "fakeinbox.com", "maildrop.cc",
  "throwawaymail.com", "mintemail.com", "spamgourmet.com", "mailcatch.com",
  "moakt.com", "emailondeck.com", "tempail.com", "tempr.email",
  "discard.email", "mytemp.email", "inboxbear.com", "byom.de",
  "example.com", "example.org", "example.net", "test.com", "test.net",
  "localhost", "app.local", "mail.com.invalid", "email.com.invalid",
]);

const BLOCKED_TLDS = ["local", "invalid", "test", "example", "localhost", "internal"];

const FAKE_LOCAL_PARTS = new Set([
  "test", "testing", "test123", "dummy", "fake", "asdf", "asdfasdf",
  "abc", "abcd", "xyz", "qwerty", "sample", "demo", "noreply", "no-reply",
]);

export type EmailCheck = { ok: true } | { ok: false; reason: string };

export function validateRealEmail(raw: string): EmailCheck {
  const email = raw.trim().toLowerCase();

  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email)) {
    return { ok: false, reason: "Please enter a valid email address." };
  }

  const [local, domain] = email.split("@");

  if (domain.includes("..") || domain.startsWith("-") || domain.endsWith("-")) {
    return { ok: false, reason: "That email domain doesn't look real." };
  }

  const tld = domain.split(".").pop() ?? "";
  if (BLOCKED_TLDS.includes(tld)) {
    return { ok: false, reason: "Please use a real email address you can receive mail on." };
  }

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { ok: false, reason: "Temporary or test email addresses aren't allowed." };
  }

  if (FAKE_LOCAL_PARTS.has(local)) {
    return { ok: false, reason: "Please use your real email address, not a test one." };
  }

  if (local.length < 3) {
    return { ok: false, reason: "That email address looks too short to be real." };
  }

  return { ok: true };
}
