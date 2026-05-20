import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { TwitterApi } from "twitter-api-v2";
import dotenv from "dotenv";

import { emailAnalysis, hibpCheck, hibpBreaches, gravatarLookup } from "./src/modules/email";
import { phoneIntel } from "./src/modules/phone";
import { usernameProbe } from "./src/modules/username";
import { ipIntel, domainIntel, generateDorks } from "./src/modules/ipdomain";

dotenv.config();

const app = express();
const PORT = 3000;
app.use(express.json());

// X (Twitter) proxy
app.get("/api/search/x", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "Query required" });
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return res.json({ results: [] });
  try {
    const client = new TwitterApi(token);
    const r = await client.v2.search(q as string, {
      "tweet.fields": ["created_at","public_metrics","author_id"],
      max_results: 10,
    });
    res.json({ results: (r.data||[]).map((t:any)=>({
      text:t.text, author:t.author_id, url:`https://x.com/i/status/${t.id}`, created:t.created_at,
    })) });
  } catch(e: any) { console.warn("X:", e.message); res.json({ results: [] }); }
});

// Unified OSINT probe — replaces the old fake /api/osint/probe
app.post("/api/osint/probe", async (req, res) => {
  const { keyword, modules } = req.body;
  if (!keyword) return res.status(400).json({ error: "Keyword required" });
  const kw = String(keyword).trim();
  const active = (modules || ["email","phone","username","ip","domain","web"])
    .map((m:string) => m.toLowerCase());
  const output: any = { keyword: kw, timestamp: new Date().toISOString(), results: {} };

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kw);
  const isPhone = /^\+?\d{7,15}$/.test(kw.replace(/\s/g,""));
  const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(kw);
  const isDomain = /^[a-zA-Z0-9][a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(kw) && !isEmail;
  const isUser = !isEmail && !isPhone && !isIP && /^[a-zA-Z0-9_]{2,32}$/.test(kw);

  const tasks: Promise<void>[] = [];

  if (active.includes("email") && isEmail) tasks.push((async () => {
    const a = emailAnalysis(kw);
    const [hb, br, gv] = a.valid
      ? await Promise.all([hibpCheck(kw), hibpBreaches(kw), gravatarLookup(kw)])
      : [null, null, null];
    output.results.email = { analysis: a, hibp: hb, breaches: br, gravatar: gv };
  })());

  if (active.includes("phone")) {
    output.results.phone = phoneIntel(kw);
  }

  if (active.includes("username") && isUser) tasks.push((async () => {
    output.results.username = await usernameProbe(kw);
  })());

  if (active.includes("ip") && isIP) tasks.push((async () => {
    output.results.ip = await ipIntel(kw);
  })());

  if (active.includes("domain") && isDomain) tasks.push((async () => {
    output.results.domain = await domainIntel(kw);
  })());

  if (active.includes("web")) {
    output.results.dorks = generateDorks(kw);
  }

  await Promise.all(tasks);

  // Optional AI summary
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const s = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `OSINT analysis for "${kw}". Summarize risks, findings, and next steps: ${JSON.stringify(output.results).slice(0, 3000)}`,
      });
      output.aiSummary = s.text;
    } catch {}
  }

  res.json(output);
});

// Individual module endpoints for direct access
app.get("/api/email/:email", async (req, res) => {
  const kw = req.params.email;
  const a = emailAnalysis(kw);
  if (!a.valid) return res.json({ valid: false });
  const [hb, br, gv] = await Promise.all([hibpCheck(kw), hibpBreaches(kw), gravatarLookup(kw)]);
  res.json({ email: kw, analysis: a, hibp: hb, breaches: br, gravatar: gv });
});

app.get("/api/phone/:phone", (req, res) => {
  res.json({ phone: req.params.phone, ...phoneIntel(req.params.phone) });
});

app.get("/api/username/:username", async (req, res) => {
  res.json(await usernameProbe(req.params.username));
});

app.get("/api/ip/:ip", async (req, res) => {
  res.json({ ip: req.params.ip, ...await ipIntel(req.params.ip) });
});

app.get("/api/domain/:domain", async (req, res) => {
  res.json(await domainIntel(req.params.domain));
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
  }
  app.listen(PORT, "0.0.0.0", () => console.log(`[Sousou] Listening on :${PORT}`));
}

startServer();