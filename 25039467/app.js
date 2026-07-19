const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Root route: basic info and link to FAQ
app.get('/', (req, res) => {
  res.send('<h1>25039467 — Personal Agent (v1)</h1><p>View the <a href="/faq">FAQ v1</a> for project information.</p>');
});

// FAQ route: returns the local FAQ JSON (read-only)
app.get('/faq', (req, res) => {
  const faqPath = path.join(__dirname, 'faq.json');
  fs.readFile(faqPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'FAQ not available' });
    res.type('application/json').send(data);
  });
});

app.listen(port, () => console.log(`Agent listening on port ${port}`));

// Note: This service is read-only with respect to the main project.
