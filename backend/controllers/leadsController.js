const axios = require('axios');
const Groq = require('groq-sdk');
const Lead = require('../models/Lead');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function calculateScore(data) {
  let score = 0;
  const text = `${data.signal} ${data.summary}`.toLowerCase();
  if (text.includes('funding') || text.includes('raised') || text.includes('series')) score += 40;
  if (text.includes('hiring') || text.includes('sales') || text.includes('sdr')) score += 30;
  if (text.includes('expansion') || text.includes('growth') || text.includes('scale')) score += 20;
  if (text.includes('launch') || text.includes('new market')) score += 10;
  score = Math.min(score, 100);
  const label = score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  return { intentScore: score, scoreLabel: label };
}

async function extractCompanyInfo(articleTitle, articleDescription) {
  const prompt = `You are a sales intelligence assistant.
Given this news article snippet, extract company information and return ONLY valid JSON, no extra text, no markdown, no backticks.

Article Title: "${articleTitle}"
Article Description: "${articleDescription}"

Return this exact JSON format:
{
  "companyName": "company name or Unknown",
  "website": "website url or N/A",
  "industry": "industry type",
  "stage": "Seed / Series A / Series B / Growth / Enterprise / Unknown",
  "signal": "one sentence describing the growth signal detected",
  "summary": "2 sentence summary of why this company might need sales outreach support"
}`;

  const response = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 500,
  });

  const raw = response.choices[0].message.content.trim();
  const cleaned = raw.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
}

exports.getLeads = async (req, res) => {
  try {
    const { sort, filter } = req.query;
    let query = {};
    if (filter && filter !== 'All') query.scoreLabel = filter;
    const sortOption = sort === 'score' ? { intentScore: -1 } : { createdAt: -1 };
    const leads = await Lead.find(query).sort(sortOption);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.scanLeads = async (req, res) => {
  try {
    const queries = [
      'startup funding raised Series A',
      'company hiring sales SDR outbound',
      'startup expansion growth new market',
      'B2B SaaS company raised funding',
      'tech startup hiring sales team',
    ];

    const allArticles = [];
    for (const q of queries) {
      try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q,
            language: 'en',
            pageSize: 5,
            sortBy: 'publishedAt',
            apiKey: process.env.NEWS_API_KEY,
          },
        });
        allArticles.push(...response.data.articles);
      } catch (e) {
        console.error('NewsAPI error:', e.message);
      }
    }

    // Deduplicate by title
    const seen = new Set();
    const unique = allArticles.filter(a => {
      if (!a.title || seen.has(a.title)) return false;
      seen.add(a.title);
      return true;
    });

    const savedLeads = [];
    for (const article of unique) {
      try {
        if (!article.title || !article.description) continue;

        const extracted = await extractCompanyInfo(article.title, article.description);
        if (!extracted.companyName || extracted.companyName === 'Unknown') continue;

        const exists = await Lead.findOne({ companyName: extracted.companyName });
        if (exists) continue;

        const { intentScore, scoreLabel } = calculateScore(extracted);
        const lead = new Lead({
          ...extracted,
          intentScore,
          scoreLabel,
          sourceUrl: article.url,
        });
        await lead.save();
        savedLeads.push(lead);
      } catch (innerErr) {
        console.error('Error processing article:', innerErr.message);
      }
    }

    res.json({ message: `${savedLeads.length} new leads discovered`, leads: savedLeads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteLead = async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};