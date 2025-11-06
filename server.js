
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

// This endpoint dynamically creates a script to expose API keys to the window object.
// It's crucial this route is defined before the static middleware.
app.get('/env.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
    // This creates the process.env object in the browser, making API keys available.
    window.process = {
      env: {
        API_KEY: "${process.env.API_KEY || ''}",
        ANTHROPIC_API_KEY: "${process.env.ANTHROPIC_API_KEY || ''}"
      }
    };
  `);
});

// Serve all static files from the root directory of the project.
app.use(express.static(path.join(__dirname, '')));

// A catch-all route to handle client-side routing. It serves the index.html
// for any request that doesn't match a static file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Olympiad Prep Pal server running on http://localhost:${port}`);
  if (!process.env.API_KEY) {
    console.warn('Warning: API_KEY environment variable is not set. The application may not function correctly.');
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('Warning: ANTHROPIC_API_KEY environment variable is not set. The fallback AI feature will be disabled.');
  }
});
