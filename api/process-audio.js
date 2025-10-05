import { IncomingForm } from 'formidable';
import fs from 'fs';
import OpenAI from 'openai';

export const config = { api: { bodyParser: false } };

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new IncomingForm({
    uploadDir: '/tmp',
    keepExtensions: true,
  });
  
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Parse error', details: err.message });
    
    if (!files.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Handle different formidable versions - in v3, files.file is an array
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    const audioPath = file.filepath || file.path || file.tempFilePath;

    // Validate file type
    const supportedFormats = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];
    const fileExtension = file.originalFilename?.split('.').pop()?.toLowerCase();
    
    if (!fileExtension || !supportedFormats.includes(fileExtension)) {
      return res.status(400).json({ 
        error: 'Invalid file format', 
        details: `Supported formats: ${supportedFormats.join(', ')}` 
      });
    }

    try {
      // Check if file exists
      if (!fs.existsSync(audioPath)) {
        return res.status(500).json({ error: 'File not found after upload' });
      }

      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: 'whisper-1'
      });
      const transcript = transcription.text;

      try {
        const summaryResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [{ 
            role: 'user', 
            content: `Please analyze this meeting transcript and provide a structured summary in the following JSON format:

{
  "participants": ["List of participants mentioned or identified in the meeting"],
  "shortSummary": "A concise 2-3 sentence summary of the meeting",
  "actionItems": ["List of specific action items with assignees if mentioned"],
  "keyPoints": ["List of important points discussed in the meeting"]
}

Transcript:
${transcript}

Please ensure the response is valid JSON and includes all four sections.` 
          }]
        });
        
        const summaryText = summaryResponse.choices[0].message.content;
        
        // Try to parse the JSON response
        let structuredSummary;
        try {
          structuredSummary = JSON.parse(summaryText);
        } catch (parseError) {
          // If JSON parsing fails, create a fallback structure
          structuredSummary = {
            participants: ["Meeting participants"],
            shortSummary: summaryText,
            actionItems: ["Action items extracted from the meeting"],
            keyPoints: ["Key points from the meeting"]
          };
        }

        // Add timestamp
        const timestamp = new Date().toISOString();
        
        res.status(200).json({ 
          transcript, 
          summary: structuredSummary,
          timestamp,
          success: true
        });
      } catch (summaryErr) {
        res.status(500).json({ error: 'OpenAI summary failed', details: summaryErr.message });
      }
    } catch (transcriptionErr) {
      res.status(500).json({ error: 'OpenAI transcription failed', details: transcriptionErr.message });
    }
  });
}
