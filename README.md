# PrivacyExplorer OSINT Engine (Tether-Alpha)

A professional-grade, privacy-first Open Source Intelligence (OSINT) forensic search engine. Powered by a native heuristic engine and augmented by AI intelligence.

## 🚀 Features

- **Tether-Alpha Native Engine**: Built-in PII (Personally Identifiable Information) pattern detection and forensic dorking.
- **AI-Powered Deep Search**: Leverages Gemini 2.0 Flash with Google Search grounding for real-time intelligence.
- **Zero-Retention Architecture**: Designed for extreme anonymity; no user data is persisted on the server.
- **Full-Stack Performance**: React 18 + Vite frontend with a high-performance Express.js backend.
- **Cyberpunk UI/UX**: High-density data visualization and interactive forensic reports.

## 🛠️ Local Setup

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <your-github-repo-url>
   cd privacy-explorer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root:
   ```env
   GEMINI_API_KEY=your_google_ai_studio_api_key
   ```

### Development
Run the development server (Frontend + Backend):
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

## 🛡️ Security Disclaimer
This tool is intended for legal OSINT research, security auditing, and personal privacy verification. Users are responsible for adhering to local laws and ethical guidelines regarding data privacy.
