// AI Service - Handles communication with OpenAI, Anthropic, Gemini, Cerebras, and Cohere APIs

// Optimization prompt builder
function buildResumePrompt(resume, jobDescription, isLatex) {
  const format = isLatex ? 'LaTeX' : 'plain text';

  return `You are an expert resume consultant and ATS (Applicant Tracking System) optimization specialist. Analyze the resume against the job description and provide targeted improvements.

## Job Description:
${jobDescription}

## Current Resume (${format}):
${resume}

## Instructions:
1. **Analyze Job Requirements:**
   - Identify required and preferred skills
   - Note key technologies and tools mentioned
   - Extract important keywords and phrases
   - Understand the role's core responsibilities

2. **Evaluate Resume Match:**
   - Calculate a match score (0-100) based on skill and keyword alignment
   - Identify which skills/experiences align well
   - Find gaps that could be addressed

3. **Generate Improvements:**
   - Rewrite bullet points to better match job requirements
   - Use action verbs and quantifiable achievements
   - Incorporate missing keywords naturally
   - Suggest skills to add or emphasize

4. **Important Guidelines:**
   - Don't fabricate experience - only reframe existing content
   - Maintain professional tone and ATS compatibility
   - ${isLatex ? 'Preserve all LaTeX formatting and commands' : 'Keep formatting simple'}
   - Focus on relevant improvements, not wholesale rewrites

## Response Format (strict JSON):
{
  "matchScore": <number 0-100>,
  "analysis": {
    "matchingSkills": ["skill1", "skill2", ...],
    "missingSkills": ["skill1", "skill2", ...],
    "keywordsFound": ["keyword1", "keyword2", ...],
    "keywordsMissing": ["keyword1", "keyword2", ...]
  },
  "suggestions": [
    {
      "type": "bullet",
      "section": "<section name>",
      "original": "<original bullet text>",
      "text": "<improved bullet text>"
    },
    {
      "type": "skill",
      "text": "<skill to add>"
    },
    {
      "type": "keyword",
      "text": "<keyword to incorporate and where>"
    }
  ],
  "updatedResume": "<complete updated ${format} with all improvements applied>"
}

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, just the JSON object.`;
}

// Call OpenAI API
async function callOpenAI(prompt, apiKey, model = 'gpt-4o') {
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
          content: 'You are a professional resume optimization expert. Always respond with valid JSON only, no additional text or formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Call Anthropic API
async function callAnthropic(prompt, apiKey, model = 'claude-sonnet-4-20250514') {
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
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Anthropic API error: ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// Call Google Gemini API
async function callGemini(prompt, apiKey, model = 'gemini-1.5-pro') {
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
                text: `You are a professional resume optimization expert. Always respond with valid JSON only, no additional text or formatting.\n\n${prompt}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

// Call Cerebras API (OpenAI-compatible)
async function callCerebras(prompt, apiKey, model = 'llama-3.3-70b') {
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
          content: 'You are a professional resume optimization expert. Always respond with valid JSON only, no additional text or formatting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || `Cerebras API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Call Cohere API
async function callCohere(prompt, apiKey, model = 'command-r-plus') {
  const response = await fetch('https://api.cohere.com/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      message: prompt,
      preamble: 'You are a professional resume optimization expert. Always respond with valid JSON only, no additional text or formatting.',
      temperature: 0.7,
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Cohere API error: ${response.status}`);
  }

  const data = await response.json();
  return data.text;
}

// Parse AI response
function parseResponse(responseText) {
  try {
    // Try to extract JSON from response
    let jsonStr = responseText.trim();

    // Handle markdown code blocks
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Handle potential leading/trailing text
    const jsonStart = jsonStr.indexOf('{');
    const jsonEnd = jsonStr.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonStr = jsonStr.substring(jsonStart, jsonEnd + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // Validate and normalize the response
    return {
      matchScore: Math.min(100, Math.max(0, parseInt(parsed.matchScore) || 0)),
      analysis: {
        matchingSkills: parsed.analysis?.matchingSkills || [],
        missingSkills: parsed.analysis?.missingSkills || [],
        keywordsFound: parsed.analysis?.keywordsFound || [],
        keywordsMissing: parsed.analysis?.keywordsMissing || []
      },
      suggestions: (parsed.suggestions || []).map(s => ({
        type: s.type || 'general',
        section: s.section || '',
        original: s.original || '',
        text: s.text || ''
      })),
      updatedLatex: parsed.updatedResume || null
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    console.error('Response was:', responseText.substring(0, 500));

    return {
      matchScore: 0,
      analysis: {
        matchingSkills: [],
        missingSkills: [],
        keywordsFound: [],
        keywordsMissing: []
      },
      suggestions: [{
        type: 'error',
        text: 'Failed to parse AI response. Please try again.'
      }],
      updatedLatex: null
    };
  }
}

// Main analysis function
async function analyzeAndOptimize(resume, jobDescription, isLatex, provider, apiKey, model) {
  // Build the prompt
  const prompt = buildResumePrompt(resume, jobDescription, isLatex);

  // Call the appropriate API
  let responseText;
  switch (provider) {
    case 'openai':
      responseText = await callOpenAI(prompt, apiKey, model);
      break;
    case 'anthropic':
      responseText = await callAnthropic(prompt, apiKey, model);
      break;
    case 'gemini':
      responseText = await callGemini(prompt, apiKey, model);
      break;
    case 'cerebras':
      responseText = await callCerebras(prompt, apiKey, model);
      break;
    case 'cohere':
      responseText = await callCohere(prompt, apiKey, model);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  // Parse and return the response
  return parseResponse(responseText);
}

// Test API connection
async function testApiConnection(provider, apiKey) {
  try {
    switch (provider) {
      case 'openai': {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return response.ok;
      }
      case 'anthropic': {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Hi' }]
          })
        });
        return response.ok;
      }
      case 'gemini': {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );
        return response.ok;
      }
      case 'cerebras': {
        const response = await fetch('https://api.cerebras.ai/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return response.ok;
      }
      case 'cohere': {
        const response = await fetch('https://api.cohere.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        return response.ok;
      }
      default:
        return false;
    }
  } catch (error) {
    console.error('API test failed:', error);
    return false;
  }
}

// Export functions
window.analyzeAndOptimize = analyzeAndOptimize;
window.testApiConnection = testApiConnection;
