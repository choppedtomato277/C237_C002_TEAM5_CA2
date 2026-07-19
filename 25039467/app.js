const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// Root route: serve simple UI page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// FAQ route: returns the local FAQ JSON (read-only)
app.get('/faq', (req, res) => {
  const faqPath = path.join(__dirname, 'faq.json');
  fs.readFile(faqPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'FAQ not available' });
    try {
      const faq = JSON.parse(data);
      const q = (req.query.q || '').toLowerCase().trim();
      if (!q) {
        return res.type('application/json').send(JSON.stringify(faq, null, 2));
      }

      // Filter entries by question or answer text (case-insensitive)
      const matches = (faq.entries || []).filter(e => {
        const question = (e.q || '').toLowerCase();
        const answer = (e.a || '').toLowerCase();
        return question.includes(q) || answer.includes(q);
      });

      return res.json({ query: req.query.q, count: matches.length, results: matches });
    } catch (parseErr) {
      return res.status(500).json({ error: 'Failed to parse FAQ' });
    }
  });
});

// Chat route: check FAQ first; if no match, use LLM (OpenAI) if API key is present,
// otherwise use simple rule-based replies.
app.get('/chat', async (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json({ error: 'no query' });

  const faqPath = path.join(__dirname, 'faq.json');
  let faqData = null;
  try { faqData = JSON.parse(fs.readFileSync(faqPath, 'utf8')); } catch (e) { faqData = null; }

  if (faqData && Array.isArray(faqData.entries)){
    const matches = faqData.entries.filter(e => {
      const question = (e.q||'').toLowerCase();
      const answer = (e.a||'').toLowerCase();
      return question.includes(q) || answer.includes(q);
    });
    if (matches.length) return res.json({ source: 'faq', count: matches.length, results: matches });
  }

  // No FAQ matches — try LLM
  const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  if (OPENAI_KEY){
    try{
      const body = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful, friendly assistant. Do not perform any actions that modify databases or production systems. If the user asks to perform admin tasks, politely decline and refer to contacting staff.' },
          { role: 'user', content: req.query.q }
        ],
        max_tokens: 150
      };
      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify(body)
      });
      const j = await r.json();
      const reply = j?.choices?.[0]?.message?.content || j?.choices?.[0]?.text || 'Sorry, no response from LLM';
      return res.json({ source: 'llm', reply });
    } catch (e){
      console.error('LLM error', e);
      return res.json({ source: 'error', error: 'LLM request failed' });
    }
  }

  // No API key — very small rule-based responses for chit-chat
  const small = q.toLowerCase();
  if (small.includes('how are you')) return res.json({ source:'rule', reply: "I'm doing well, thanks for asking — how can I help you today?" });
  if (small.includes('hello') || small.includes('hi')) return res.json({ source:'rule', reply: 'Hello! I can answer FAQ questions or have a quick chat.' });
  if (small.includes('thanks') || small.includes('thank you')) return res.json({ source:'rule', reply: "You're welcome!" });
  return res.json({ source:'rule', reply: "I can chat briefly. To enable more natural replies, set your OPENAI_API_KEY environment variable." });
});

app.listen(port, () => console.log(`Agent listening on port ${port}`));

// Note: This service is read-only with respect to the main project.
