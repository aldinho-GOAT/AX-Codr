document.addEventListener('DOMContentLoaded', () => {
  // -----------------------------
  // Default Code Templates
  // -----------------------------
  const DEFAULT_HTML = `
<div class="content-box">
  <h1>Welcome to Ramadan 2.0</h1>
  <p>Happy Ramadan!</p>
</div>
  `.trim();

  const DEFAULT_CSS = `
body {
  margin: 0;
  background: #0f1117;
  color: #e6edf3;
  font-family: Inter, Arial, sans-serif;
}

.content-box {
  margin: 40px auto;
  max-width: 700px;
  padding: 24px;
  background: #161a22;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

h1 {
  margin-top: 0;
}
  `.trim();

  const DEFAULT_JS = `
// Tip: To see the Ramadan theme in action,
// go to Settings > Appearance and select it!
console.log("AX-Editor v2.0 Initialized.");
  `.trim();

  // -----------------------------
  // Element Selectors
  // -----------------------------
  const htmlEditor = document.getElementById('html-editor');
  const cssEditor = document.getElementById('css-editor');
  const jsEditor = document.getElementById('js-editor');
  const previewWindow = document.getElementById('live-preview');
  const workspaceGrid = document.querySelector('.workspace-grid');

  const runButtons = document.querySelectorAll('.run-btn, .nav-item[data-action="run"]');
  const saveButtons = document.querySelectorAll('.save-btn');
  const resetButton = document.querySelector('.nav-item[data-action="reset"]');
  const codeInputs = document.querySelectorAll('.code-input');

  const settingsButton = document.querySelector('.settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeModalButton = document.querySelector('[data-action="close-settings"]');
  const applyButton = document.querySelector('[data-action="apply-settings"]');

  const themeSelect = document.getElementById('theme-select');
  const fontSizeSelect = document.getElementById('font-size-select');
  const projectNameInput = document.getElementById('project-name-input');
  const layoutSelect = document.getElementById('layout-select');
  const penTitleDisplay = document.querySelector('.pen-title');

  const openFileButton = document.getElementById('open-file-btn');
  const fileInput = document.getElementById('file-input');

  const editors = [htmlEditor, cssEditor, jsEditor].filter(Boolean);

  // -----------------------------
  // Utilities
  // -----------------------------
  function debounce(func, delay = 300) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  function safeProjectName(name) {
    const cleanName = (name || '').trim();
    return cleanName || 'Untitled Project';
  }

  function fileNameFromProject(name) {
    return safeProjectName(name)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  function setProjectTitle(name) {
    if (penTitleDisplay) {
      penTitleDisplay.textContent = safeProjectName(name);
    }
  }

  function getEditorValues() {
    return {
      html: htmlEditor?.value || '',
      css: cssEditor?.value || '',
      js: jsEditor?.value || ''
    };
  }

  // -----------------------------
  // Preview Logic
  // -----------------------------
  function updatePreview() {
    if (!previewWindow) return;

    const { html, css, js } = getEditorValues();

    const content = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>
    try {
      ${js}
    } catch (error) {
      console.error("Preview JS Error:", error);
    }
  <\/script>
</body>
</html>
    `.trim();

    try {
      const previewDoc = previewWindow.contentDocument || previewWindow.contentWindow?.document;
      if (!previewDoc) return;

      previewDoc.open();
      previewDoc.write(content);
      previewDoc.close();
    } catch (error) {
      console.error('Error updating preview:', error);
    }
  }

  const debouncedUpdatePreview = debounce(updatePreview, 300);

  editors.forEach(editor => {
    editor.addEventListener('input', debouncedUpdatePreview);
  });

  runButtons.forEach(button => {
    button.addEventListener('click', updatePreview);
  });

  // -----------------------------
  // Reset Logic
  // -----------------------------
  function resetCode() {
    if (htmlEditor) htmlEditor.value = DEFAULT_HTML;
    if (cssEditor) cssEditor.value = DEFAULT_CSS;
    if (jsEditor) jsEditor.value = DEFAULT_JS;
    updatePreview();
    console.log('Editors reset to default templates.');
  }

  if (resetButton) {
    resetButton.addEventListener('click', e => {
      e.preventDefault();
      resetCode();
    });
  }

  // -----------------------------
  // Save / Download Logic
  // -----------------------------
  function buildFullHTMLDocument() {
    const { html, css, js } = getEditorValues();
    const title = safeProjectName(penTitleDisplay?.textContent);

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
${css}
  </style>
</head>
<body>
${html}
  <script>
${js}
  <\/script>
</body>
</html>
    `.trim();
  }

  function downloadFile(filename, content, type = 'text/html') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  saveButtons.forEach(button => {
    button.addEventListener('click', () => {
      const projectName = safeProjectName(penTitleDisplay?.textContent);
      const fileName = `${fileNameFromProject(projectName)}.html`;
      const fullHtml = buildFullHTMLDocument();

      downloadFile(fileName, fullHtml);
      console.log(`Downloaded: ${fileName}`);
    });
  });

  // -----------------------------
  // File Open Logic
  // -----------------------------
  if (openFileButton && fileInput) {
    openFileButton.addEventListener('click', e => {
      e.preventDefault();
      fileInput.click();
    });

    fileInput.addEventListener('change', e => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      let targetEditor = null;

      if (fileName.endsWith('.html')) {
        targetEditor = htmlEditor;
      } else if (fileName.endsWith('.css')) {
        targetEditor = cssEditor;
      } else if (fileName.endsWith('.js')) {
        targetEditor = jsEditor;
      }

      if (!targetEditor) {
        alert('Unsupported file type. Please select an HTML, CSS, or JS file.');
        fileInput.value = '';
        return;
      }

      const reader = new FileReader();

      reader.onload = event => {
        targetEditor.value = event.target?.result || '';
        updatePreview();
        fileInput.value = '';
      };

      reader.onerror = () => {
        alert('Could not read the selected file.');
        fileInput.value = '';
      };

      reader.readAsText(file);
    });
  }

  // -----------------------------
  // Settings Logic
  // -----------------------------
  function loadSettings() {
    const savedTheme = localStorage.getItem('editorTheme') || 'default';
    const savedFontSize = localStorage.getItem('editorFontSize') || '14px';
    const savedProjectName = localStorage.getItem('projectName') || 'Untitled Project';
    const savedLayout = localStorage.getItem('editorLayout') || 'default';

    document.body.setAttribute('data-theme', savedTheme);

    codeInputs.forEach(input => {
      input.style.fontSize = savedFontSize;
    });

    setProjectTitle(savedProjectName);

    if (workspaceGrid) {
      workspaceGrid.setAttribute('data-layout', savedLayout);
    }

    if (themeSelect) themeSelect.value = savedTheme;
    if (fontSizeSelect) fontSizeSelect.value = savedFontSize;
    if (projectNameInput) projectNameInput.value = savedProjectName;
    if (layoutSelect) layoutSelect.value = savedLayout;
  }

  function applySettings() {
    const selectedTheme = themeSelect?.value || 'default';
    const selectedFontSize = fontSizeSelect?.value || '14px';
    const newProjectName = safeProjectName(projectNameInput?.value);
    const newLayout = layoutSelect?.value || 'default';

    document.body.setAttribute('data-theme', selectedTheme);

    codeInputs.forEach(input => {
      input.style.fontSize = selectedFontSize;
    });

    setProjectTitle(newProjectName);

    if (workspaceGrid) {
      workspaceGrid.setAttribute('data-layout', newLayout);
    }

    localStorage.setItem('editorTheme', selectedTheme);
    localStorage.setItem('editorFontSize', selectedFontSize);
    localStorage.setItem('projectName', newProjectName);
    localStorage.setItem('editorLayout', newLayout);

    if (settingsModal) {
      settingsModal.style.display = 'none';
    }
  }

  function openSettingsModal() {
    if (!settingsModal) return;

    loadSettings();
    settingsModal.style.display = 'block';
  }

  function closeSettingsModal() {
    if (!settingsModal) return;
    settingsModal.style.display = 'none';
  }

  if (settingsButton) {
    settingsButton.addEventListener('click', openSettingsModal);
  }

  if (closeModalButton) {
    closeModalButton.addEventListener('click', closeSettingsModal);
  }

  if (applyButton) {
    applyButton.addEventListener('click', applySettings);
  }

  window.addEventListener('click', e => {
    if (e.target === settingsModal) {
      closeSettingsModal();
    }
  });

  // -----------------------------
  // Initialization
  // -----------------------------
  function initializeEditor() {
    if (htmlEditor && !htmlEditor.value.trim()) htmlEditor.value = DEFAULT_HTML;
    if (cssEditor && !cssEditor.value.trim()) cssEditor.value = DEFAULT_CSS;
    if (jsEditor && !jsEditor.value.trim()) jsEditor.value = DEFAULT_JS;

    loadSettings();
    updatePreview();
  }

  initializeEditor();
});
