// LaTeX Processor
// Handles parsing, modification, and generation of LaTeX resume content

// Common LaTeX resume sections
const RESUME_SECTIONS = [
  'education',
  'experience',
  'work experience',
  'professional experience',
  'skills',
  'technical skills',
  'projects',
  'certifications',
  'awards',
  'publications',
  'summary',
  'objective',
  'profile'
];

// Extract sections from LaTeX
function extractLatexSections(latex) {
  const sections = {};

  // Match section commands: \section{...}, \subsection{...}
  const sectionRegex = /\\(section|subsection)\*?\{([^}]+)\}([\s\S]*?)(?=\\(?:section|subsection)\*?\{|\\end\{document\}|$)/gi;

  let match;
  while ((match = sectionRegex.exec(latex)) !== null) {
    const sectionName = match[2].toLowerCase().trim();
    const sectionContent = match[3].trim();
    sections[sectionName] = {
      name: match[2],
      content: sectionContent,
      type: match[1]
    };
  }

  return sections;
}

// Extract bullet points from LaTeX
function extractBulletPoints(latex) {
  const bullets = [];

  // Match itemize/enumerate environments
  const itemRegex = /\\item\s*([\s\S]*?)(?=\\item|\\end\{(?:itemize|enumerate)\})/gi;

  let match;
  while ((match = itemRegex.exec(latex)) !== null) {
    const content = cleanLatexText(match[1]);
    if (content.trim()) {
      bullets.push({
        original: match[0],
        text: content.trim()
      });
    }
  }

  return bullets;
}

// Clean LaTeX text by removing common commands
function cleanLatexText(latex) {
  return latex
    // Remove comments
    .replace(/%.*$/gm, '')
    // Handle text formatting commands
    .replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textit\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    .replace(/\\underline\{([^}]*)\}/g, '$1')
    .replace(/\\texttt\{([^}]*)\}/g, '$1')
    // Handle href
    .replace(/\\href\{[^}]*\}\{([^}]*)\}/g, '$1')
    // Remove other common commands
    .replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^}]*\})?/g, '')
    // Clean up braces
    .replace(/[{}]/g, '')
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Replace a bullet point in LaTeX
function replaceBulletPoint(latex, originalBullet, newBullet) {
  // Escape special regex characters in the original
  const escapedOriginal = originalBullet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(escapedOriginal, 'g');
  return latex.replace(regex, `\\item ${newBullet}`);
}

// Add skill to skills section
function addSkillToLatex(latex, skill, skillsSection = 'skills') {
  // Find the skills section
  const sectionRegex = new RegExp(
    `(\\\\section\\*?\\{${skillsSection}\\}[\\s\\S]*?)(\\\\section|\\\\end\\{document\\})`,
    'i'
  );

  const match = latex.match(sectionRegex);
  if (match) {
    // Check if skills are in itemize or inline
    if (match[1].includes('\\begin{itemize}')) {
      // Add as new item
      const newContent = match[1].replace(
        /\\end\{itemize\}/,
        `\\item ${skill}\n\\end{itemize}`
      );
      return latex.replace(match[1], newContent);
    } else {
      // Add inline with comma
      const newContent = match[1].trim() + `, ${skill}\n`;
      return latex.replace(match[1], newContent);
    }
  }

  return latex;
}

// Generate a complete updated LaTeX document
function updateLatexDocument(originalLatex, changes) {
  let updatedLatex = originalLatex;

  // Apply bullet point changes
  if (changes.bulletPoints) {
    changes.bulletPoints.forEach(change => {
      if (change.original && change.new) {
        updatedLatex = replaceBulletPoint(updatedLatex, change.original, change.new);
      }
    });
  }

  // Add new skills
  if (changes.skills) {
    changes.skills.forEach(skill => {
      updatedLatex = addSkillToLatex(updatedLatex, skill);
    });
  }

  return updatedLatex;
}

// Validate LaTeX syntax (basic check)
function validateLatex(latex) {
  const errors = [];

  // Check for document class
  if (!latex.includes('\\documentclass')) {
    errors.push('Missing \\documentclass declaration');
  }

  // Check for begin/end document
  if (!latex.includes('\\begin{document}')) {
    errors.push('Missing \\begin{document}');
  }
  if (!latex.includes('\\end{document}')) {
    errors.push('Missing \\end{document}');
  }

  // Check for unmatched braces
  const openBraces = (latex.match(/\{/g) || []).length;
  const closeBraces = (latex.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    errors.push(`Unmatched braces: ${openBraces} open, ${closeBraces} close`);
  }

  // Check for unmatched environments
  const beginEnvs = latex.match(/\\begin\{(\w+)\}/g) || [];
  const endEnvs = latex.match(/\\end\{(\w+)\}/g) || [];

  const envCounts = {};
  beginEnvs.forEach(env => {
    const name = env.match(/\\begin\{(\w+)\}/)[1];
    envCounts[name] = (envCounts[name] || 0) + 1;
  });
  endEnvs.forEach(env => {
    const name = env.match(/\\end\{(\w+)\}/)[1];
    envCounts[name] = (envCounts[name] || 0) - 1;
  });

  Object.entries(envCounts).forEach(([name, count]) => {
    if (count !== 0) {
      errors.push(`Unmatched environment: ${name} (${count > 0 ? 'missing \\end' : 'extra \\end'})`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

// Format LaTeX for display (basic syntax highlighting could be added)
function formatLatexForDisplay(latex) {
  // Just clean up whitespace for now
  return latex
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Convert plain text resume to basic LaTeX
function textToBasicLatex(text, template = 'article') {
  const lines = text.split('\n').filter(line => line.trim());

  let latex = `\\documentclass{${template}}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{enumitem}

\\begin{document}

`;

  let inList = false;

  lines.forEach(line => {
    const trimmed = line.trim();

    // Detect section headers (usually all caps or followed by colon)
    if (trimmed.match(/^[A-Z][A-Z\s]+$/) || trimmed.match(/^[A-Z][^:]+:$/)) {
      if (inList) {
        latex += '\\end{itemize}\n\n';
        inList = false;
      }
      const sectionName = trimmed.replace(/:$/, '');
      latex += `\\section*{${sectionName}}\n`;
    }
    // Detect bullet points
    else if (trimmed.match(/^[-•*]\s/)) {
      if (!inList) {
        latex += '\\begin{itemize}\n';
        inList = true;
      }
      const content = trimmed.replace(/^[-•*]\s/, '');
      latex += `  \\item ${escapeLatex(content)}\n`;
    }
    // Regular text
    else if (trimmed) {
      if (inList) {
        latex += '\\end{itemize}\n\n';
        inList = false;
      }
      latex += `${escapeLatex(trimmed)}\n\n`;
    }
  });

  if (inList) {
    latex += '\\end{itemize}\n';
  }

  latex += '\n\\end{document}';

  return latex;
}

// Escape special LaTeX characters
function escapeLatex(text) {
  return text
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}');
}

// Export functions
window.LatexProcessor = {
  extractSections: extractLatexSections,
  extractBulletPoints,
  cleanText: cleanLatexText,
  replaceBulletPoint,
  addSkill: addSkillToLatex,
  updateDocument: updateLatexDocument,
  validate: validateLatex,
  format: formatLatexForDisplay,
  textToLatex: textToBasicLatex,
  escape: escapeLatex
};
