import axios from "axios";

const PLATFORMS = [
  { name:"GitHub", u:"https://github.com/{u}" },{ name:"Twitter/X", u:"https://x.com/{u}" },
  { name:"Instagram", u:"https://www.instagram.com/{u}/" },{ name:"Reddit", u:"https://www.reddit.com/user/{u}" },
  { name:"YouTube", u:"https://www.youtube.com/@{u}" },{ name:"TikTok", u:"https://www.tiktok.com/@{u}" },
  { name:"Telegram", u:"https://t.me/{u}" },{ name:"Medium", u:"https://medium.com/@{u}" },
  { name:"Dev.to", u:"https://dev.to/{u}" },{ name:"HackerNews", u:"https://news.ycombinator.com/user?id={u}" },
  { name:"Pinterest", u:"https://www.pinterest.com/{u}/" },{ name:"Twitch", u:"https://www.twitch.tv/{u}" },
  { name:"Keybase", u:"https://keybase.io/{u}" },{ name:"Patreon", u:"https://www.patreon.com/{u}" },
  { name:"Spotify", u:"https://open.spotify.com/user/{u}" },{ name:"SoundCloud", u:"https://soundcloud.com/{u}" },
  { name:"Vimeo", u:"https://vimeo.com/{u}" },{ name:"Flickr", u:"https://www.flickr.com/people/{u}" },
  { name:"Dribbble", u:"https://dribbble.com/{u}" },{ name:"Behance", u:"https://www.behance.net/{u}" },
  { name:"Steam", u:"https://steamcommunity.com/id/{u}" },{ name:"GitLab", u:"https://gitlab.com/{u}" },
  { name:"Bitbucket", u:"https://bitbucket.org/{u}/" },{ name:"Linktree", u:"https://linktr.ee/{u}" },
  { name:"LeetCode", u:"https://leetcode.com/{u}" },{ name:"StackOverflow", u:"https://stackoverflow.com/users/{u}" },
  { name:"npm", u:"https://www.npmjs.com/~{u}" },{ name:"PyPI", u:"https://pypi.org/user/{u}/" },
  { name:"V2EX", u:"https://www.v2ex.com/member/{u}" },{ name:"Zhihu", u:"https://www.zhihu.com/people/{u}" },
];

export async function usernameProbe(username: string) {
  const out: { name: string; url: string; found: boolean }[] = [];
  const BATCH = 5;
  for (let i = 0; i < PLATFORMS.length; i += BATCH) {
    const batch = PLATFORMS.slice(i, i + BATCH);
    const r = await Promise.all(batch.map(async p => {
      const url = p.u.replace("{u}", encodeURIComponent(username));
      try {
        const resp = await axios.get(url, {
          timeout: 5000, maxRedirects: 3,
          headers: {"User-Agent":"Mozilla/5.0 (compatible; Sousou/1.0)"},
          validateStatus: () => true,
        });
        return { name: p.name, url, found: resp.status >= 200 && resp.status < 400 };
      } catch { return { name: p.name, url, found: false }; }
    }));
    out.push(...r);
  }
  return { username, hits: out.filter(x => x.found).length, total: out.length, results: out };
}