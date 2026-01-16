// PDF Parser using PDF.js
// Extracts text content from PDF files

// Load PDF.js from CDN (we'll use the ES module version)
const PDF_JS_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfjsLib = null;

// Initialize PDF.js
async function initPdfJs() {
  if (pdfjsLib) return pdfjsLib;

  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.pdfjsLib) {
      pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      resolve(pdfjsLib);
      return;
    }

    // Load the script
    const script = document.createElement('script');
    script.src = PDF_JS_URL;
    script.onload = () => {
      pdfjsLib = window.pdfjsLib;
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
      resolve(pdfjsLib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
}

// Parse PDF file and extract text
async function parsePdf(file) {
  await initPdfJs();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const typedArray = new Uint8Array(event.target.result);
        const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;

        let fullText = '';
        const numPages = pdf.numPages;

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Extract text items and join them
          const pageText = textContent.items
            .map(item => {
              // Handle different item types
              if (item.str) {
                return item.str;
              }
              return '';
            })
            .join(' ');

          fullText += pageText + '\n\n';
        }

        // Clean up the extracted text
        const cleanedText = cleanExtractedText(fullText);
        resolve(cleanedText);
      } catch (error) {
        reject(new Error(`PDF parsing error: ${error.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read PDF file'));
    reader.readAsArrayBuffer(file);
  });
}

// Clean up extracted text
function cleanExtractedText(text) {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Fix common PDF extraction issues
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
    .replace(/(\d)([A-Za-z])/g, '$1 $2') // Add space between numbers and letters
    .replace(/([A-Za-z])(\d)/g, '$1 $2')
    // Restore line breaks for common resume sections
    .replace(/(experience|education|skills|projects|summary|objective|certifications?|awards?)/gi, '\n\n$1')
    // Clean up multiple spaces and newlines
    .replace(/\n\s*\n/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();
}

// Alternative: Simple text extraction for browsers without PDF.js support
function extractTextFallback(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        // This is a very basic extraction that won't work well
        // but provides a fallback
        const text = event.target.result;
        resolve('PDF text extraction requires PDF.js. Please paste your resume text manually or use a LaTeX file.');
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

// Export for use in popup
window.parsePdf = parsePdf;
