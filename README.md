LeadRadar — AI-Powered Sales Intelligence Platform

An internal tool that automatically discovers and scores high-intent companies for outbound sales outreach.

Live Demo https
🔗 https://lead-gen-platform-cyan.vercel.app

How It Works


Fetches real news articles about startups (funding, hiring, expansion)
Groq AI (Llama 3.1) reads each article and extracts company info
Rule-based scoring ranks companies by likelihood to need outbound support
Dashboard displays leads with intent score, signal, and summary


Tech Stack


Frontend: React + Tailwind CSS (Vercel)
Backend: Node.js + Express (Render)
Database: MongoDB Atlas
AI: Groq API (Llama 3.1) for extraction and summarization
Data Source: NewsAPI for real-time signal discovery


V1 (Built)


NewsAPI-based company discovery
Groq AI extraction (company, industry, stage, signal)
Rule-based intent scoring (High / Medium / Low)
MongoDB lead storage
React dashboard with filter, sort, search
Delete leads


V2 (Planned)


LinkedIn signal scraping
Automated daily scanning pipeline
Contact enrichment (decision maker emails)
ICP-based filtering (define your ideal customer profile)
Slack/email alerts for new high-intent leads
Stronger scoring model using ML


Signal Types Detected


Recently raised funding (Series A/B/C)
Actively hiring SDRs / sales roles
Expanding into new markets
New product launches
Revenue growth signals


Setup

bash# Backend
cd backend
npm install
# Add .env with MONGO_URI, NEWS_API_KEY, GROQ_API_KEY
node server.js

# Frontend
cd frontend
npm install
# Add .env with VITE_API_URL
npm run dev
