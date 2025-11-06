const express = require('express');
const path = require('path');
const fs = require('fs'); // Import the file system module
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
app.use(express.static(__dirname));

// A catch-all route to handle client-side routing. It serves the index.html
// for any request that doesn't match a static file. This must be the last route.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`Olympiad Prep Pal server running on http://localhost:${port}`);
  
  // --- Diagnostic File Listing ---
  console.log('--- Checking for deployed files ---');
  fs.readdir(__dirname, (err, files) => {
    if (err) {
      console.error('Could not list files in root directory:', err);
    } else {
      console.log('Files in root directory:', files ? files.join(', ') : 'No files found');
      // Specifically check for critical files
      if (!files || !files.includes('index.html')) console.error('CRITICAL: index.html is missing!');
      if (!files || !files.includes('index.tsx')) console.error('CRITICAL: index.tsx is missing!');
    }
  });
  
  const componentsDir = path.join(__dirname, 'components');
  if (fs.existsSync(componentsDir)) {
      fs.readdir(componentsDir, (err, files) => {
        if (err) {
          console.error('Could not list files in components/ directory:', err);
        } else {
          console.log('Files in components/ directory:', files ? files.join(', ') : 'No files found');
        }
      });
  } else {
      console.warn('Warning: components/ directory does not exist.');
  }
  console.log('------------------------------------');

  // --- Environment Variable Check ---
  console.log('--- Environment Variable Check ---');
  if (process.env.API_KEY) {
      console.log('API_KEY: Found (ends with ...' + process.env.API_KEY.slice(-4) + ')');
  } else {
      console.warn('Warning: API_KEY environment variable is not set.');
  }
  
  if (process.env.ANTHROPIC_API_KEY) {
      console.log('ANTHROPIC_API_KEY: Found (ends with ...' + process.env.ANTHROPIC_API_KEY.slice(-4) + ')');
  } else {
      console.warn('Warning: ANTHROPIC_API_KEY environment variable is not set.');
  }
  console.log('------------------------------------');
});