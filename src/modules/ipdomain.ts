import axios from "axios";

export async function ipIntel(ip: string) {
  try {
    const res = await axios.get(`http://ip-api.com/json/${ip}?fields=66846719`, { timeout: 5000 });
    if (res.data.status === "success") {
      const { status, ...rest } = res.data;
      return { valid: true, ...rest };
    }
  } catch {}
  return { valid: false };
}

export async function domainIntel(domain: string) {
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*/, "");
  try {
    const res = await axios.get(`https://rdap.org/domain/${clean}`, { timeout: 8000, validateStatus: () => true });
    if (res.status === 200) {
      return {
        domain: clean, registered: true,
        nameservers: (res.data.nameservers || []).map((n: any) => n.ldhName),
        status: res.data.status || [],
        entities: (res.data.entities || []).map((e: any) => ({
          role: (e.roles || []).join(", "),
          name: e.vcardArray?.[1]?.[1]?.[3] || "redacted",
        })),
      };
    }
  } catch {}
  return { domain: clean, registered: false };
}

export function generateDorks(keyword: string) {
  return [
    { name:"Pastebin/Leaks", query:`site:pastebin.com | site:rentry.co "${keyword}"` },
    { name:"GitHub Secrets", query:`site:github.com "${keyword}" (password OR api_key OR token)` },
    { name:"Cloud Storage", query:`site:s3.amazonaws.com | site:storage.googleapis.com "${keyword}"` },
    { name:"Config Files", query:`filetype:env | filetype:config | filetype:yml "${keyword}"` },
    { name:"SQL Dumps", query:`filetype:sql "${keyword}"` },
    { name:"CN Forums", query:`site:v2ex.com | site:hostloc.com "${keyword}"` },
    { name:"Documents", query:`filetype:pdf | filetype:doc "${keyword}"` },
  ];
}