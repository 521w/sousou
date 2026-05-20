import crypto from "crypto";
import axios from "axios";

const DISPOSABLE = new Set(["mailinator.com","guerrillamail.com","10minutemail.com","tempmail.com","yopmail.com","sharklasers.com","trashmail.com","maildrop.cc","getnada.com","temp-mail.org","emailondeck.com","mintemail.com","spam4.me","grr.la","pokemail.net","spamobox.com","20minutemail.com"]);
const FREEMAIL = new Set(["gmail.com","yahoo.com","outlook.com","hotmail.com","aol.com","icloud.com","protonmail.com","mail.com","yandex.com","zoho.com","gmx.com","qq.com","163.com","126.com","sina.com","sohu.com"]);

export function emailAnalysis(email: string) {
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!valid) return { valid: false, domain: "", type: "invalid", disposable: false, freemail: false };
  const domain = email.split("@")[1].toLowerCase();
  return { valid: true, domain, type: domain.split(".").length > 2 ? "subdomain" : "standard", disposable: DISPOSABLE.has(domain), freemail: FREEMAIL.has(domain) };
}

export async function hibpCheck(email: string) {
  try {
    const hash = crypto.createHash("sha1").update(email.trim().toLowerCase()).digest("hex").toUpperCase();
    const [prefix, suffix] = [hash.slice(0, 5), hash.slice(5)];
    const res = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, { timeout: 8000 });
    const match = (res.data as string).split("\n").find((l: string) => l.startsWith(suffix));
    return { breaches: match ? parseInt(match.split(":")[1], 10) : 0 };
  } catch { return { breaches: 0 }; }
}

export async function hibpBreaches(email: string) {
  try {
    const res = await axios.get(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}`, {
      headers: { "hibp-api-key": process.env.HIBP_API_KEY || "", "user-agent": "sousou" },
      timeout: 8000, validateStatus: () => true,
    });
    return res.status === 200 ? (res.data as any[]).map((b: any) => ({
      name: b.Name, domain: b.Domain, date: b.BreachDate, count: b.PwnCount, classes: b.DataClasses
    })) : [];
  } catch { return []; }
}

export async function gravatarLookup(email: string) {
  try {
    const hash = crypto.createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
    const res = await axios.get(`https://www.gravatar.com/${hash}.json`, { timeout: 5000, validateStatus: () => true });
    if (res.status !== 200 || !res.data?.entry?.length) return null;
    const e = res.data.entry[0];
    return {
      displayName: e.displayName, profileUrl: e.profileUrl, thumbnail: e.thumbnailUrl,
      accounts: (e.accounts || []).map((a: any) => ({ domain: a.domain, display: a.display, url: a.url }))
    };
  } catch { return null; }
}