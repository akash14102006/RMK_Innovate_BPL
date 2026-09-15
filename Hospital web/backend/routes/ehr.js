const express = require('express');
const router = express.Router();
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const scriptPath = path.join(__dirname, '../scripts/extract_pdf_text.py');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, os.tmpdir()),
    filename: (req, file, cb) => cb(null, `ehr-pdf-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`),
  }),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed'));
  },
});

const { parseEHRText } = require('../services/aiService');

/**
 * POST /api/ehr/extract-pdf
 * Body: multipart/form-data with field "file" (PDF file)
 * Returns: { text: string, structuredData?: object } or { error: string }
 */
router.post('/extract-pdf', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      console.error('[EHR extract-pdf] upload error:', err.message);
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }
    next();
  });
}, async (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No PDF file uploaded. Use form field "file".' });
  }

  const pythonCommands = process.platform === 'win32' ? ['py', 'python'] : ['python3', 'python'];

  const runPythonExtraction = (cmdIndex) => {
    return new Promise((resolve, reject) => {
      if (cmdIndex >= pythonCommands.length) {
        return reject(new Error('Python not found. Install Python and run: pip install pymupdf'));
      }

      const pythonCmd = pythonCommands[cmdIndex];
      const py = spawn(pythonCmd, [scriptPath, file.path], { stdio: ['ignore', 'pipe', 'pipe'] });

      let stdout = '';
      let stderr = '';

      py.stdout.on('data', (data) => { stdout += data.toString(); });
      py.stderr.on('data', (data) => { stderr += data.toString(); });

      py.on('close', (code) => {
        if (code !== 0) {
          console.error('[EHR extract-pdf] Python exit', code, 'stderr:', stderr);
          resolve(runPythonExtraction(cmdIndex + 1));
        } else {
          resolve(stdout || '');
        }
      });

      py.on('error', (err) => {
        console.error('[EHR extract-pdf] spawn error:', err.message);
        resolve(runPythonExtraction(cmdIndex + 1));
      });
    });
  };

  try {
    const extractedText = await runPythonExtraction(0);

    // Cleanup file
    try { fs.unlinkSync(file.path); } catch (_) { }

    if (!extractedText || extractedText.trim().length === 0) {
      return res.json({ text: '', structuredData: {} });
    }

    // Now use Gemini to parse the extracted text
    let structuredData = {};
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('[EHR extract-pdf] Parsing with Gemini...');
        structuredData = await parseEHRText(extractedText);
      } catch (err) {
        console.error('[EHR extract-pdf] AI Parsing failed:', err.message);
      }
    }

    res.json({ text: extractedText, structuredData });
  } catch (err) {
    // Cleanup file on error
    try { fs.unlinkSync(file.path); } catch (_) { }
    console.error('[EHR extract-pdf] Error:', err.message);
    res.status(500).json({
      error: 'PDF extraction failed',
      details: err.message
    });
  }
});

/**
 * POST /api/ehr/parse-text
 * Body: { text: string }
 * Returns: { structuredData: object }
 */
router.post('/parse-text', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'No text provided' });
  }

  let structuredData = {};
  if (process.env.GEMINI_API_KEY) {
    try {
      structuredData = await parseEHRText(text);
    } catch (err) {
      console.error('[EHR parse-text] AI Parsing failed:', err.message);
    }
  }

  res.json({ structuredData });
});

module.exports = router;

/* updated */
