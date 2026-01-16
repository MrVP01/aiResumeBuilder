// PDF Generator
// Provides options for generating PDFs from LaTeX

// LaTeX compilation services (free options)
const LATEX_SERVICES = {
  // Overleaf - User redirects there
  overleaf: {
    name: 'Overleaf',
    url: 'https://www.overleaf.com/docs',
    description: 'Professional LaTeX editor with instant compilation'
  },
  // LaTeX.Online API
  latexOnline: {
    name: 'LaTeX.Online',
    url: 'https://latexonline.cc/compile',
    description: 'Free online LaTeX compilation'
  }
};

// Generate PDF using LaTeX.Online service
async function compileLatexOnline(latexCode) {
  const formData = new FormData();

  // Create a blob from the LaTeX code
  const blob = new Blob([latexCode], { type: 'text/plain' });
  formData.append('file', blob, 'resume.tex');

  try {
    const response = await fetch('https://latexonline.cc/compile', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Compilation failed: ${response.status}`);
    }

    // Get the PDF as a blob
    const pdfBlob = await response.blob();
    return pdfBlob;
  } catch (error) {
    console.error('LaTeX compilation error:', error);
    throw new Error('Failed to compile LaTeX. Please try Overleaf instead.');
  }
}

// Download PDF blob
function downloadPdf(blob, filename = 'optimized_resume.pdf') {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Open LaTeX in Overleaf
function openInOverleaf(latexCode) {
  // Create a form to submit to Overleaf
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.overleaf.com/docs';
  form.target = '_blank';

  // Add the LaTeX content
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'snip';
  input.value = latexCode;
  form.appendChild(input);

  // Submit the form
  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

// Create downloadable .tex file
function downloadTex(latexCode, filename = 'optimized_resume.tex') {
  const blob = new Blob([latexCode], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Show PDF generation options modal
function showPdfOptions(latexCode) {
  const modal = document.createElement('div');
  modal.className = 'pdf-modal-overlay';
  modal.innerHTML = `
    <div class="pdf-modal">
      <h3>Generate PDF</h3>
      <p>Choose how to compile your LaTeX resume:</p>

      <div class="pdf-options">
        <button class="pdf-option" id="option-overleaf">
          <span class="option-icon">🌿</span>
          <span class="option-title">Open in Overleaf</span>
          <span class="option-desc">Best quality, full LaTeX support</span>
        </button>

        <button class="pdf-option" id="option-download-tex">
          <span class="option-icon">📄</span>
          <span class="option-title">Download .tex File</span>
          <span class="option-desc">Compile locally or upload to Overleaf</span>
        </button>

        <button class="pdf-option" id="option-online">
          <span class="option-icon">⚡</span>
          <span class="option-title">Quick PDF (Beta)</span>
          <span class="option-desc">Compile online - may have limitations</span>
        </button>
      </div>

      <button class="pdf-close" id="close-modal">Cancel</button>
    </div>
  `;

  // Add modal styles
  const style = document.createElement('style');
  style.textContent = `
    .pdf-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    }
    .pdf-modal {
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 320px;
      width: 90%;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }
    .pdf-modal h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
    }
    .pdf-modal p {
      margin: 0 0 16px 0;
      color: #64748b;
      font-size: 13px;
    }
    .pdf-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 16px;
    }
    .pdf-option {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }
    .pdf-option:hover {
      border-color: #6366f1;
      background: #f5f3ff;
    }
    .option-icon {
      font-size: 20px;
      margin-bottom: 4px;
    }
    .option-title {
      font-weight: 600;
      font-size: 14px;
    }
    .option-desc {
      font-size: 11px;
      color: #64748b;
    }
    .pdf-close {
      width: 100%;
      padding: 10px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-size: 13px;
    }
    .pdf-close:hover {
      background: #f8fafc;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(modal);

  // Event handlers
  document.getElementById('option-overleaf').onclick = () => {
    openInOverleaf(latexCode);
    modal.remove();
  };

  document.getElementById('option-download-tex').onclick = () => {
    downloadTex(latexCode);
    modal.remove();
  };

  document.getElementById('option-online').onclick = async () => {
    const btn = document.getElementById('option-online');
    btn.innerHTML = '<span class="option-title">Compiling...</span>';
    btn.disabled = true;

    try {
      const pdfBlob = await compileLatexOnline(latexCode);
      downloadPdf(pdfBlob);
      modal.remove();
    } catch (error) {
      alert(error.message);
      btn.innerHTML = `
        <span class="option-icon">⚡</span>
        <span class="option-title">Quick PDF (Beta)</span>
        <span class="option-desc">Compile online - may have limitations</span>
      `;
      btn.disabled = false;
    }
  };

  document.getElementById('close-modal').onclick = () => modal.remove();
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
}

// Export functions
window.PdfGenerator = {
  compileOnline: compileLatexOnline,
  downloadPdf,
  openInOverleaf,
  downloadTex,
  showOptions: showPdfOptions
};
