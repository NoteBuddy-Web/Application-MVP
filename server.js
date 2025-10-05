const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { OPENAI_API_KEY } = require('./openai-config');
const app = express();
const PORT = 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp'); // Temporary directory for uploads
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept audio files
    const allowedTypes = ['audio/mp3', 'audio/mpeg', 'audio/x-m4a', 'audio/m4a', 'audio/wav', 'audio/webm', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  }
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the login page as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve other HTML files
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'home.html'));
});

app.get('/calendar', (req, res) => {
    res.sendFile(path.join(__dirname, 'notebuddy_prototype_calendar_view.html'));
});

app.get('/summary', (req, res) => {
    res.sendFile(path.join(__dirname, 'notebuddy_prototype_summary_view.html'));
});

app.get('/tasks', (req, res) => {
    res.sendFile(path.join(__dirname, 'notebuddy_prototype_task_list.html'));
});

app.get('/record', (req, res) => {
    res.sendFile(path.join(__dirname, 'notebuddy_prototype_record_upload.html'));
});

app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'notebuddy_prototype_settings_page.html'));
});

app.get('/client-detail', (req, res) => {
    res.sendFile(path.join(__dirname, 'notebuddy_prototype_client_detail.html'));
});

// API endpoint for processing audio files with real ChatGPT integration
app.post('/api/process-audio', upload.single('file'), async (req, res) => {
    try {
        console.log('📡 Audio processing request received');
        console.log('📁 Request body:', req.body);
        console.log('📁 Request file:', req.file);
        console.log('📁 Request headers:', req.headers);
        
        if (!req.file) {
            console.error('❌ No file uploaded');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('Audio file uploaded:', req.file.originalname, 'Size:', req.file.size);

        // Check if OpenAI API key is available
        const apiKey = process.env.OPENAI_API_KEY || OPENAI_API_KEY;
        if (!apiKey || apiKey === 'sk-your-actual-openai-api-key-here' || apiKey === 'your_openai_api_key_here') {
            console.warn('OpenAI API key not configured, using mock data');
            console.log('To enable real transcription:');
            console.log('1. Get your API key from: https://platform.openai.com/api-keys');
            console.log('2. Set it as environment variable: export OPENAI_API_KEY="your_key"');
            console.log('3. Or update openai-config.js with your key');
            return res.json(getMockSummary());
        }

        // Import OpenAI dynamically
        const { OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: apiKey });

        // Transcribe audio using Whisper
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(req.file.path),
            model: 'whisper-1'
        });
        const transcript = transcription.text;

        // Generate summary using GPT-4
        const summaryResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [{ 
                role: 'user', 
                content: `Act like a Professional Meeting Assistant and analyze this meeting transcript, provide a structured brief summary in the following JSON format:

{
  "title": "Meeting Summary",
  "participants": ["List of participants mentioned or identified in the meeting. If no specific names are mentioned, use 'Participant 1', 'Participant 2', etc. based on the number of speakers detected"],
  "keyPoints": ["List of important points discussed in the meeting"],
  "actionItems": [
    {
      "task": "Specific action item with clear description",
      "assignee": "Person responsible (use 'TBD' if not specified)",
      "dueDate": "YYYY-MM-DD (use today's date if not specified)",
      "priority": "High/Medium/Low"
    }
  ],
  "summary": "A comprehensive 2-3 sentence summary of the meeting",
  "transcript": "Formatted transcript with clear speaker identification. CRITICAL: Each time a different person speaks, start a new line with 'Participant X:' followed by their words. Analyze the conversation flow and identify when speakers change. Use 'Participant 1:', 'Participant 2:', 'Participant 3:', etc. for each different speaker. Each speaker's complete statement should be on one line.",
  "tags": ["relevant", "tags", "categorization"]
}

IMPORTANT INSTRUCTIONS:
- Use a simple title like "Meeting Summary" without including the date
- For participants: If specific names are mentioned, use those names. If no names are given, analyze the transcript to determine how many speakers there are and use "Participant 1", "Participant 2", "Participant 3", etc.
- For transcript: CRITICAL - Format the transcript with clear speaker identification. Analyze the conversation to identify when different people are speaking. Each time a different person speaks, start a new line with "Participant X:" followed by their complete statement. Use "Participant 1:", "Participant 2:", "Participant 3:", etc. for each different speaker. Do NOT put multiple speakers on the same line. Each speaker change should be a new line.
- Look VERY carefully for action items, tasks, assignments, follow-ups, or commitments mentioned in the transcript
- Include both obvious and subtle action items - look for implied tasks, future work, decisions that require follow-up
- Look for phrases like: "need to", "should", "will do", "assigned to", "follow up", "next steps", "we'll", "going to", "plan to", "decided to", "agreed to", "promised to", "commit to", "responsible for", "take care of", "handle", "work on", "prepare", "review", "check", "update", "send", "create", "finish", "complete"
- Also look for implicit action items in decisions, agreements, or plans mentioned
- Limit to maximum 3 action items - choose the most important ones
- If no action items are found, use an empty array: "actionItems": []
- For action items, extract the specific task description, who it's assigned to, and any mentioned deadlines
- If assignee is not clear, use "TBD"
- If no deadline is mentioned, use today's date (${new Date().toISOString().split('T')[0]})
- Limit key points to maximum 4 most important points discussed

Transcript:
${transcript}

Please ensure the response is valid JSON and only include actionItems and keypoints if they are clearly identified in the transcript.` 
            }]
        });
        
        const summaryText = summaryResponse.choices[0].message.content;
        
        // Try to parse the JSON response
        let structuredSummary;
        try {
            structuredSummary = JSON.parse(summaryText);
            
            // Ensure actionItems is an array and filter out empty items
            if (structuredSummary.actionItems && Array.isArray(structuredSummary.actionItems)) {
                structuredSummary.actionItems = structuredSummary.actionItems.filter(item => 
                    item && (typeof item === 'string' ? item.trim() : item.task && item.task.trim())
                ).slice(0, 3); // Limit to 3 action items
            } else {
                structuredSummary.actionItems = [];
            }
            
            // Limit key points to 4
            if (structuredSummary.keyPoints && Array.isArray(structuredSummary.keyPoints)) {
                structuredSummary.keyPoints = structuredSummary.keyPoints.slice(0, 4);
            }
        } catch (parseError) {
            console.warn('Failed to parse JSON response, using fallback structure');
            structuredSummary = {
                title: "Meeting Summary",
                participants: ["Participant 1", "Participant 2"],
                keyPoints: ["Key points from the meeting"],
                actionItems: [], // Empty array instead of mock action item
                summary: summaryText,
                tags: ["meeting", "transcript"]
            };
        }

        // Add additional fields for compatibility
        console.log('ChatGPT structured summary:', JSON.stringify(structuredSummary, null, 2));
        console.log('Raw transcript length:', transcript ? transcript.length : 0);
        console.log('ChatGPT transcript length:', structuredSummary.transcript ? structuredSummary.transcript.length : 0);
        
        const finalSummary = {
            ...structuredSummary,
            date: new Date().toISOString(),
            duration: "Unknown", // Could be calculated from audio length
            // Use formatted transcript from ChatGPT if available, otherwise use raw transcript
            transcript: structuredSummary.transcript || transcript
        };
        
        console.log('Final transcript being sent:', finalSummary.transcript ? finalSummary.transcript.substring(0, 200) + '...' : 'No transcript');

        res.json(finalSummary);
    } catch (error) {
        console.error('Error processing audio:', error);
        
        // Fallback to mock data if OpenAI fails
        if (error.message.includes('OpenAI') || error.message.includes('API')) {
            console.warn('OpenAI API error, falling back to mock data');
            return res.json(getMockSummary());
        }
        
        res.status(500).json({ 
            error: 'Failed to process audio file',
            details: error.message 
        });
    }
});

// Helper function for mock data fallback
function getMockSummary() {
    return {
        title: "Meeting Summary",
        date: new Date().toISOString(),
        duration: "15:30",
        participants: ["John Doe", "Jane Smith", "Mike Johnson"],
        keyPoints: [
            "Discussed project timeline and deliverables",
            "Reviewed budget allocation for Q2",
            "Assigned tasks for next sprint",
            "Scheduled follow-up meeting for next week"
        ],
        actionItems: [
            {
                task: "Prepare budget report",
                assignee: "John Doe",
                dueDate: "2024-01-15",
                priority: "High"
            },
            {
                task: "Update project documentation",
                assignee: "Jane Smith", 
                dueDate: "2024-01-12",
                priority: "Medium"
            },
            {
                task: "Schedule team meeting",
                assignee: "Mike Johnson",
                dueDate: "2024-01-10",
                priority: "Low"
            }
        ],
        transcript: "This is a mock transcript of the meeting. In a real implementation, this would contain the actual transcribed audio content from the uploaded file. The system would use speech-to-text services to convert the audio into text, then use AI to analyze and summarize the content.",
        summary: "The team discussed the current project status, reviewed the budget for the upcoming quarter, and assigned specific tasks to team members. Key decisions were made regarding the project timeline and resource allocation.",
        tags: ["Work", "Project", "Meeting"]
    };
}

// Error handling middleware for multer
app.use((error, req, res, next) => {
    console.error('❌ Multer error:', error);
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 25MB.' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files. Only one file allowed.' });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({ error: 'Unexpected file field.' });
        }
    }
    res.status(400).json({ error: error.message });
});

app.listen(PORT, () => {
    console.log(`NoteBuddy prototype server running at http://localhost:${PORT}`);
    console.log('Login page: http://localhost:3001/login');
    console.log('Main app: http://localhost:3001/index');
});
