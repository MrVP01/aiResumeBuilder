// Service Worker for AI Resume Optimizer
// Handles background tasks, context menus, and message routing

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'captureJobDescription',
    title: 'Capture for Resume Optimization',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'captureJobDescription') {
    const selectedText = info.selectionText;
    if (selectedText) {
      saveJobDescription(selectedText);
    }
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'captureJobDescription':
      saveJobDescription(request.text);
      sendResponse({ success: true });
      break;

    case 'getJobDescription':
      chrome.storage.local.get(['jobDescription'], (result) => {
        sendResponse({ jobDescription: result.jobDescription });
      });
      return true; // Required for async response

    case 'analyzeResume':
      handleAnalyzeResume(request)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Required for async response

    default:
      break;
  }
});

// Save job description to storage
async function saveJobDescription(text) {
  try {
    await chrome.storage.local.set({ jobDescription: text.trim() });

    // Show notification
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#22c55e' });

    // Clear badge after 3 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 3000);
  } catch (error) {
    console.error('Error saving job description:', error);
  }
}

// Handle resume analysis request
async function handleAnalyzeResume(request) {
  const { resume, jobDescription, isLatex, provider, apiKey, model } = request;

  try {
    const prompt = buildOptimizationPrompt(resume, jobDescription, isLatex);

    let response;
    switch (provider) {
      case 'openai':
        response = await callOpenAI(prompt, apiKey, model);
        break;
      case 'anthropic':
        response = await callAnthropic(prompt, apiKey, model);
        break;
      case 'gemini':
        response = await callGemini(prompt, apiKey, model);
        break;
      case 'cerebras':
        response = await callCerebras(prompt, apiKey, model);
        break;
      case 'cohere':
        response = await callCohere(prompt, apiKey, model);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    return parseAIResponse(response, isLatex);
  } catch (error) {
    console.error('Error analyzing resume:', error);
    throw error;
  }
}

// Build the optimization prompt
function buildOptimizationPrompt(resume, jobDescription, isLatex) {
  const format = isLatex ? 'LaTeX' : 'plain text';

  return `You are an expert resume consultant and ATS (Applicant Tracking System) optimization specialist. Your task is to analyze a resume against a job description and provide specific, actionable improvements.

## Job Description:
${jobDescription}

## Current Resume (${format}):
${resume}

## Your Task:
1. Analyze the job description to identify:
   - Required skills and technologies
   - Key responsibilities
   - Important keywords and phrases
   - Experience requirements

2. Compare the resume against these requirements and provide:
   - A match score (0-100) based on keyword and skill alignment
   - Specific bullet point improvements that better align with the job
   - Skills that should be added or highlighted
   - Keywords that should be incorporated

3. ${isLatex ? 'Provide the complete updated LaTeX code with your improvements integrated.' : 'Provide the improved resume text.'}

## Response Format (JSON):
{
  "matchScore": <number 0-100>,
  "analysis": {
    "matchingSkills": ["skill1", "skill2"],
    "missingSkills": ["skill1", "skill2"],
    "keywordsFound": ["keyword1", "keyword2"],
    "keywordsMissing": ["keyword1", "keyword2"]
  },
  "suggestions": [
    {
      "type": "bullet" | "skill" | "keyword" | "format",
      "section": "<resume section name>",
      "original": "<original text if applicable>",
      "text": "<the improvement suggestion or new text>"
    }
  ],
  "updatedResume": "<complete ${isLatex ? 'LaTeX code' : 'resume text'} with improvements>"
}

Important guidelines:
- Keep the original resume structure and formatting
- Make improvements that sound natural and professional
- Don't fabricate experience - only reframe existing content
- Focus on quantifiable achievements where possible
- Use action verbs that align with the job description
- Ensure ATS compatibility (avoid tables, graphics references in LaTeX)

Respond ONLY with valid JSON, no additional text.`;
}

// Call OpenAI API
async function callOpenAI(prompt, apiKey, model) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume consultant. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Call Anthropic API
async function callAnthropic(prompt, apiKey, model) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API error');
  }

  const data = await response.json();
  return data.content[0].text;
}

// Call Google Gemini API
async function callGemini(prompt, apiKey, model) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are an expert resume consultant. Always respond with valid JSON only.\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Call Cerebras API (OpenAI-compatible)
async function callCerebras(prompt, apiKey, model) {
  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert resume consultant. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Cerebras API error');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Call Cohere API
async function callCohere(prompt, apiKey, model) {
  const response = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      message: prompt,
      preamble: 'You are an expert resume consultant. Always respond with valid JSON only.',
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Cohere API error');
  }

  const data = await response.json();
  return data.text;
}

// Parse AI response
function parseAIResponse(responseText, isLatex) {
  try {
    // Try to extract JSON from the response
    let jsonStr = responseText;

    // Handle case where response has markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    return {
      matchScore: parsed.matchScore || 0,
      analysis: parsed.analysis || {},
      suggestions: parsed.suggestions || [],
      updatedLatex: isLatex ? parsed.updatedResume : null,
      updatedText: !isLatex ? parsed.updatedResume : null
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Return a basic structure if parsing fails
    return {
      matchScore: 0,
      analysis: {},
      suggestions: [{
        type: 'error',
        text: 'Could not parse AI response. Please try again.'
      }],
      updatedLatex: null,
      updatedText: null
    };
  }
}
