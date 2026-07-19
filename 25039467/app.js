const express = require('express');
const fs = require('fs');
const path = require('path');

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

app.listen(port, () => console.log(`Agent listening on port ${port}`));

// Note: This service is read-only with respect to the main project.
