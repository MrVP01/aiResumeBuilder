// State management
const state = {
  resumeLatex: null,
  resumeText: null,
  resumeType: 'latex',
  jobDescription: null,
  results: null,
  settings: {
    provider: 'openai',
    openaiKey: '',
    anthropicKey: '',
    geminiKey: '',
    cerebrasKey: '',
    cohereKey: '',
    model: 'gpt-4o'
  }
};

// DOM Elements
const elements = {
  // Tabs
  tabs: document.querySelectorAll('.tab'),
  tabContents: document.querySelectorAll('.tab-content'),

  // Resume tab
  resumeStatus: document.getElementById('resume-status'),
  toggleBtns: document.querySelectorAll('.toggle-btn'),
  latexInput: document.getElementById('latex-input'),
  pdfInput: document.getElementById('pdf-input'),
  latexDropZone: document.getElementById('latex-drop-zone'),
  latexFileInput: document.getElementById('latex-file-input'),
  latexFileBtn: document.getElementById('latex-file-btn'),
  latexTextarea: document.getElementById('latex-textarea'),
  saveLatexBtn: document.getElementById('save-latex-btn'),
  pdfDropZone: document.getElementById('pdf-drop-zone'),
  pdfFileInput: document.getElementById('pdf-file-input'),
  pdfFileBtn: document.getElementById('pdf-file-btn'),
  pdfPreview: document.getElementById('pdf-preview'),
  pdfTextPreview: document.getElementById('pdf-text-preview'),

  // Job tab
  jobStatus: document.getElementById('job-status'),
  captureBtn: document.getElementById('capture-btn'),
  jobTextarea: document.getElementById('job-textarea'),
  jobPreview: document.getElementById('job-preview'),
  jobTextPreview: document.getElementById('job-text-preview'),
  clearJobBtn: document.getElementById('clear-job-btn'),
  optimizeBtn: document.getElementById('optimize-btn'),

  // Results tab
  resultsLoading: document.getElementById('results-loading'),
  resultsEmpty: document.getElementById('results-empty'),
  resultsContent: document.getElementById('results-content'),
  loadingTip: document.getElementById('loading-tip'),
  matchPercentage: document.getElementById('match-percentage'),
  suggestionsList: document.getElementById('suggestions-list'),
  updatedLatex: document.getElementById('updated-latex'),
  copyLatexBtn: document.getElementById('copy-latex-btn'),
  downloadTexBtn: document.getElementById('download-tex-btn'),
  generatePdfBtn: document.getElementById('generate-pdf-btn'),

  // Settings tab
  providerRadios: document.querySelectorAll('input[name="ai-provider"]'),
  openaiSettings: document.getElementById('openai-settings'),
  anthropicSettings: document.getElementById('anthropic-settings'),
  geminiSettings: document.getElementById('gemini-settings'),
  cerebrasSettings: document.getElementById('cerebras-settings'),
  cohereSettings: document.getElementById('cohere-settings'),
  openaiKey: document.getElementById('openai-key'),
  anthropicKey: document.getElementById('anthropic-key'),
  geminiKey: document.getElementById('gemini-key'),
  cerebrasKey: document.getElementById('cerebras-key'),
  cohereKey: document.getElementById('cohere-key'),
  toggleOpenaiKey: document.getElementById('toggle-openai-key'),
  toggleAnthropicKey: document.getElementById('toggle-anthropic-key'),
  toggleGeminiKey: document.getElementById('toggle-gemini-key'),
  toggleCerebrasKey: document.getElementById('toggle-cerebras-key'),
  toggleCohereKey: document.getElementById('toggle-cohere-key'),
  modelSelect: document.getElementById('model-select'),
  openaiModels: document.getElementById('openai-models'),
  anthropicModels: document.getElementById('anthropic-models'),
  geminiModels: document.getElementById('gemini-models'),
  cerebrasModels: document.getElementById('cerebras-models'),
  cohereModels: document.getElementById('cohere-models'),
  saveSettingsBtn: document.getElementById('save-settings-btn'),
  settingsStatus: document.getElementById('settings-status')
};

// Loading tips
const loadingTips = [
  'Analyzing job requirements...',
  'Matching skills to job description...',
  'Identifying keyword opportunities...',
  'Crafting improved bullet points...',
  'Optimizing for ATS systems...'
];

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
  await loadSettings();
  await loadSavedData();
  setupEventListeners();
  updateUI();
}

// Load settings from storage
async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['settings']);
    if (result.settings) {
      state.settings = { ...state.settings, ...result.settings };
    }
    applySettingsToUI();
  } catch (error) {
    console.error('Error loading settings:', error);
  }
}

// Load saved resume and job data
async function loadSavedData() {
  try {
    const result = await chrome.storage.local.get(['resumeLatex', 'resumeText', 'resumeType', 'jobDescription']);
    if (result.resumeLatex) state.resumeLatex = result.resumeLatex;
    if (result.resumeText) state.resumeText = result.resumeText;
    if (result.resumeType) state.resumeType = result.resumeType;
    if (result.jobDescription) state.jobDescription = result.jobDescription;
  } catch (error) {
    console.error('Error loading saved data:', error);
  }
}

// Apply settings to UI
function applySettingsToUI() {
  // Set provider radio
  elements.providerRadios.forEach(radio => {
    radio.checked = radio.value === state.settings.provider;
  });

  // Show/hide provider settings
  updateProviderUI();

  // Set API keys
  elements.openaiKey.value = state.settings.openaiKey || '';
  elements.anthropicKey.value = state.settings.anthropicKey || '';
  elements.geminiKey.value = state.settings.geminiKey || '';
  elements.cerebrasKey.value = state.settings.cerebrasKey || '';
  elements.cohereKey.value = state.settings.cohereKey || '';

  // Set model
  elements.modelSelect.value = state.settings.model || 'gpt-4o';
}

// Update provider-specific UI
function updateProviderUI() {
  const provider = state.settings.provider;

  // Hide all provider settings and model groups
  elements.openaiSettings.classList.add('hidden');
  elements.anthropicSettings.classList.add('hidden');
  elements.geminiSettings.classList.add('hidden');
  elements.cerebrasSettings.classList.add('hidden');
  elements.cohereSettings.classList.add('hidden');
  elements.openaiModels.classList.add('hidden');
  elements.anthropicModels.classList.add('hidden');
  elements.geminiModels.classList.add('hidden');
  elements.cerebrasModels.classList.add('hidden');
  elements.cohereModels.classList.add('hidden');

  // Show the selected provider's settings and models
  const defaultModels = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
    gemini: 'gemini-1.5-pro',
    cerebras: 'llama-3.3-70b',
    cohere: 'command-r-plus'
  };

  switch (provider) {
    case 'openai':
      elements.openaiSettings.classList.remove('hidden');
      elements.openaiModels.classList.remove('hidden');
      break;
    case 'anthropic':
      elements.anthropicSettings.classList.remove('hidden');
      elements.anthropicModels.classList.remove('hidden');
      break;
    case 'gemini':
      elements.geminiSettings.classList.remove('hidden');
      elements.geminiModels.classList.remove('hidden');
      break;
    case 'cerebras':
      elements.cerebrasSettings.classList.remove('hidden');
      elements.cerebrasModels.classList.remove('hidden');
      break;
    case 'cohere':
      elements.cohereSettings.classList.remove('hidden');
      elements.cohereModels.classList.remove('hidden');
      break;
  }

  // Update model selection if current model doesn't match provider
  const currentModel = elements.modelSelect.value;
  const modelPrefixes = {
    openai: ['gpt'],
    anthropic: ['claude'],
    gemini: ['gemini'],
    cerebras: ['llama'],
    cohere: ['command']
  };

  const validPrefixes = modelPrefixes[provider] || [];
  const isValidModel = validPrefixes.some(prefix => currentModel.startsWith(prefix));

  if (!isValidModel) {
    elements.modelSelect.value = defaultModels[provider];
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  elements.tabs.forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Resume type toggle
  elements.toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => switchResumeType(btn.dataset.type));
  });

  // LaTeX file handling
  elements.latexFileBtn.addEventListener('click', () => elements.latexFileInput.click());
  elements.latexFileInput.addEventListener('change', handleLatexFile);
  setupDragDrop(elements.latexDropZone, handleLatexFile);
  elements.saveLatexBtn.addEventListener('click', saveLatexResume);

  // PDF file handling
  elements.pdfFileBtn.addEventListener('click', () => elements.pdfFileInput.click());
  elements.pdfFileInput.addEventListener('change', handlePdfFile);
  setupDragDrop(elements.pdfDropZone, handlePdfFile);

  // Job description
  elements.captureBtn.addEventListener('click', captureSelection);
  elements.jobTextarea.addEventListener('input', handleJobInput);
  elements.clearJobBtn.addEventListener('click', clearJobDescription);
  elements.optimizeBtn.addEventListener('click', optimizeResume);

  // Results
  elements.copyLatexBtn.addEventListener('click', copyLatex);
  elements.downloadTexBtn.addEventListener('click', downloadTex);
  elements.generatePdfBtn.addEventListener('click', generatePdf);

  // Settings
  elements.providerRadios.forEach(radio => {
    radio.addEventListener('change', handleProviderChange);
  });
  elements.toggleOpenaiKey.addEventListener('click', () => toggleKeyVisibility('openai'));
  elements.toggleAnthropicKey.addEventListener('click', () => toggleKeyVisibility('anthropic'));
  elements.toggleGeminiKey.addEventListener('click', () => toggleKeyVisibility('gemini'));
  elements.toggleCerebrasKey.addEventListener('click', () => toggleKeyVisibility('cerebras'));
  elements.toggleCohereKey.addEventListener('click', () => toggleKeyVisibility('cohere'));
  elements.saveSettingsBtn.addEventListener('click', saveSettings);
}

// Tab switching
function switchTab(tabName) {
  elements.tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
  elements.tabContents.forEach(c => c.classList.toggle('active', c.id === `${tabName}-tab`));
}

// Resume type switching
function switchResumeType(type) {
  state.resumeType = type;
  elements.toggleBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
  elements.latexInput.classList.toggle('hidden', type !== 'latex');
  elements.pdfInput.classList.toggle('hidden', type !== 'pdf');
}

// Drag and drop setup
function setupDragDrop(dropZone, handler) {
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'));
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'));
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handler({ target: { files } });
    }
  });
}

// Handle LaTeX file
async function handleLatexFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.tex')) {
    showStatus('settings', 'Please upload a .tex file', 'error');
    return;
  }

  try {
    const text = await file.text();
    elements.latexTextarea.value = text;
    await saveLatexResume();
  } catch (error) {
    console.error('Error reading LaTeX file:', error);
    showStatus('settings', 'Error reading file', 'error');
  }
}

// Save LaTeX resume
async function saveLatexResume() {
  const latex = elements.latexTextarea.value.trim();
  if (!latex) {
    showStatus('settings', 'Please enter LaTeX code', 'error');
    return;
  }

  state.resumeLatex = latex;
  state.resumeText = extractTextFromLatex(latex);
  state.resumeType = 'latex';

  try {
    await chrome.storage.local.set({
      resumeLatex: state.resumeLatex,
      resumeText: state.resumeText,
      resumeType: state.resumeType
    });
    updateResumeStatus(true);
    showStatus('settings', 'Resume saved!', 'success');
  } catch (error) {
    console.error('Error saving resume:', error);
    showStatus('settings', 'Error saving resume', 'error');
  }
}

// Handle PDF file
async function handlePdfFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.name.endsWith('.pdf')) {
    showStatus('settings', 'Please upload a PDF file', 'error');
    return;
  }

  try {
    const text = await parsePdf(file);
    state.resumeText = text;
    state.resumeType = 'pdf';

    elements.pdfPreview.classList.remove('hidden');
    elements.pdfTextPreview.textContent = text.substring(0, 500) + (text.length > 500 ? '...' : '');

    await chrome.storage.local.set({
      resumeText: state.resumeText,
      resumeType: state.resumeType
    });

    updateResumeStatus(true);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    showStatus('settings', 'Error parsing PDF', 'error');
  }
}

// Capture selection from page
async function captureSelection() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection().toString()
    });

    const selectedText = results[0]?.result;

    if (selectedText && selectedText.trim()) {
      state.jobDescription = selectedText.trim();
      elements.jobTextarea.value = state.jobDescription;
      updateJobPreview();
      await chrome.storage.local.set({ jobDescription: state.jobDescription });
    } else {
      showStatus('settings', 'No text selected. Please select text on the page first.', 'error');
    }
  } catch (error) {
    console.error('Error capturing selection:', error);
    showStatus('settings', 'Error capturing selection. Try refreshing the page.', 'error');
  }
}

// Handle manual job input
function handleJobInput() {
  const text = elements.jobTextarea.value.trim();
  if (text) {
    state.jobDescription = text;
    updateJobPreview();
  }
}

// Update job preview
function updateJobPreview() {
  if (state.jobDescription) {
    elements.jobPreview.classList.remove('hidden');
    elements.jobTextPreview.textContent = state.jobDescription;
    elements.jobStatus.textContent = 'Captured';
    elements.jobStatus.classList.add('success');
    elements.optimizeBtn.disabled = !state.resumeText && !state.resumeLatex;
  }
}

// Clear job description
function clearJobDescription() {
  state.jobDescription = null;
  elements.jobTextarea.value = '';
  elements.jobPreview.classList.add('hidden');
  elements.jobStatus.textContent = 'Not captured';
  elements.jobStatus.classList.remove('success');
  elements.optimizeBtn.disabled = true;
  chrome.storage.local.remove('jobDescription');
}

// Optimize resume
async function optimizeResume() {
  if (!state.jobDescription) {
    showStatus('settings', 'Please capture a job description first', 'error');
    return;
  }

  if (!state.resumeLatex && !state.resumeText) {
    showStatus('settings', 'Please upload your resume first', 'error');
    return;
  }

  const apiKeyMap = {
    openai: state.settings.openaiKey,
    anthropic: state.settings.anthropicKey,
    gemini: state.settings.geminiKey,
    cerebras: state.settings.cerebrasKey,
    cohere: state.settings.cohereKey
  };
  const apiKey = apiKeyMap[state.settings.provider];

  if (!apiKey) {
    showStatus('settings', 'Please add your API key in Settings', 'error');
    switchTab('settings');
    return;
  }

  // Switch to results tab and show loading
  switchTab('results');
  elements.resultsLoading.classList.remove('hidden');
  elements.resultsEmpty.classList.add('hidden');
  elements.resultsContent.classList.add('hidden');

  // Cycle through loading tips
  let tipIndex = 0;
  const tipInterval = setInterval(() => {
    elements.loadingTip.textContent = loadingTips[tipIndex];
    tipIndex = (tipIndex + 1) % loadingTips.length;
  }, 2000);
  elements.loadingTip.textContent = loadingTips[0];

  try {
    const resumeContent = state.resumeLatex || state.resumeText;
    const isLatex = !!state.resumeLatex;

    const results = await analyzeAndOptimize(
      resumeContent,
      state.jobDescription,
      isLatex,
      state.settings.provider,
      apiKey,
      state.settings.model
    );

    state.results = results;
    displayResults(results);
  } catch (error) {
    console.error('Error optimizing resume:', error);
    elements.resultsLoading.classList.add('hidden');
    elements.resultsEmpty.classList.remove('hidden');
    elements.resultsEmpty.querySelector('p').textContent = `Error: ${error.message}`;
  } finally {
    clearInterval(tipInterval);
  }
}

// Display results
function displayResults(results) {
  elements.resultsLoading.classList.add('hidden');
  elements.resultsEmpty.classList.add('hidden');
  elements.resultsContent.classList.remove('hidden');

  // Match percentage
  elements.matchPercentage.textContent = results.matchScore || 0;

  // Suggestions
  elements.suggestionsList.innerHTML = '';
  if (results.suggestions && results.suggestions.length > 0) {
    results.suggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.className = `suggestion-item ${suggestion.type || ''}`;
      item.innerHTML = `
        <div class="suggestion-type">${suggestion.type || 'Improvement'}</div>
        <div class="suggestion-text">${suggestion.text}</div>
        ${suggestion.original ? `<div class="suggestion-original">Original: ${suggestion.original}</div>` : ''}
      `;
      elements.suggestionsList.appendChild(item);
    });
  }

  // Updated LaTeX
  if (results.updatedLatex) {
    elements.updatedLatex.value = results.updatedLatex;
  } else {
    elements.updatedLatex.value = 'No LaTeX output available. Please provide LaTeX input for updated code.';
  }
}

// Copy LaTeX to clipboard
async function copyLatex() {
  try {
    await navigator.clipboard.writeText(elements.updatedLatex.value);
    elements.copyLatexBtn.innerHTML = '<span class="btn-icon">✓</span> Copied!';
    setTimeout(() => {
      elements.copyLatexBtn.innerHTML = '<span class="btn-icon">📋</span> Copy LaTeX';
    }, 2000);
  } catch (error) {
    console.error('Error copying:', error);
  }
}

// Download .tex file
function downloadTex() {
  const latex = elements.updatedLatex.value;
  const blob = new Blob([latex], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'optimized_resume.tex';
  a.click();
  URL.revokeObjectURL(url);
}

// Generate PDF (placeholder - would need LaTeX compilation service)
async function generatePdf() {
  const latex = elements.updatedLatex.value;
  if (!latex || latex.includes('No LaTeX output')) {
    alert('No LaTeX code available. Please provide a LaTeX resume first.');
    return;
  }

  // Show PDF generation options
  if (window.PdfGenerator) {
    window.PdfGenerator.showOptions(latex);
  } else {
    // Fallback if PDF generator not loaded
    alert('To generate a PDF:\n\n1. Copy the LaTeX code above\n2. Go to Overleaf (overleaf.com)\n3. Create a new project and paste the code\n4. Compile and download the PDF');
  }
}

// Provider change handler
function handleProviderChange(event) {
  state.settings.provider = event.target.value;
  updateProviderUI();
}

// Toggle API key visibility
function toggleKeyVisibility(provider) {
  const inputMap = {
    openai: elements.openaiKey,
    anthropic: elements.anthropicKey,
    gemini: elements.geminiKey,
    cerebras: elements.cerebrasKey,
    cohere: elements.cohereKey
  };
  const input = inputMap[provider];
  if (input) {
    input.type = input.type === 'password' ? 'text' : 'password';
  }
}

// Save settings
async function saveSettings() {
  state.settings.openaiKey = elements.openaiKey.value.trim();
  state.settings.anthropicKey = elements.anthropicKey.value.trim();
  state.settings.geminiKey = elements.geminiKey.value.trim();
  state.settings.cerebrasKey = elements.cerebrasKey.value.trim();
  state.settings.cohereKey = elements.cohereKey.value.trim();
  state.settings.model = elements.modelSelect.value;

  try {
    await chrome.storage.local.set({ settings: state.settings });
    showStatus('settings', 'Settings saved!', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('settings', 'Error saving settings', 'error');
  }
}

// Show status message
function showStatus(tab, message, type) {
  elements.settingsStatus.textContent = message;
  elements.settingsStatus.className = `status-message ${type}`;
  elements.settingsStatus.classList.remove('hidden');

  setTimeout(() => {
    elements.settingsStatus.classList.add('hidden');
  }, 3000);
}

// Update resume status badge
function updateResumeStatus(hasResume) {
  if (hasResume) {
    elements.resumeStatus.textContent = 'Saved';
    elements.resumeStatus.classList.add('success');
  } else {
    elements.resumeStatus.textContent = 'Not uploaded';
    elements.resumeStatus.classList.remove('success');
  }
}

// Update UI based on state
function updateUI() {
  // Update resume status
  const hasResume = state.resumeLatex || state.resumeText;
  updateResumeStatus(hasResume);

  // Populate LaTeX textarea if saved
  if (state.resumeLatex) {
    elements.latexTextarea.value = state.resumeLatex;
  }

  // Show PDF preview if we have PDF text
  if (state.resumeType === 'pdf' && state.resumeText) {
    switchResumeType('pdf');
    elements.pdfPreview.classList.remove('hidden');
    elements.pdfTextPreview.textContent = state.resumeText.substring(0, 500) +
      (state.resumeText.length > 500 ? '...' : '');
  }

  // Update job description UI
  if (state.jobDescription) {
    elements.jobTextarea.value = state.jobDescription;
    updateJobPreview();
  }

  // Update optimize button state
  elements.optimizeBtn.disabled = !hasResume || !state.jobDescription;
}

// Extract text from LaTeX (basic implementation)
function extractTextFromLatex(latex) {
  // Remove comments
  let text = latex.replace(/%.*$/gm, '');

  // Remove common LaTeX commands but keep their arguments
  text = text.replace(/\\(textbf|textit|emph|underline)\{([^}]*)\}/g, '$2');
  text = text.replace(/\\(section|subsection|subsubsection)\*?\{([^}]*)\}/g, '\n$2\n');

  // Remove other commands
  text = text.replace(/\\[a-zA-Z]+\*?(\[[^\]]*\])?(\{[^}]*\})?/g, '');

  // Remove environments
  text = text.replace(/\\begin\{[^}]*\}/g, '');
  text = text.replace(/\\end\{[^}]*\}/g, '');

  // Clean up
  text = text.replace(/[{}]/g, '');
  text = text.replace(/\n\s*\n/g, '\n');
  text = text.trim();

  return text;
}
