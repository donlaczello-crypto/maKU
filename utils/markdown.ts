
declare global {
  interface Window {
    marked: { Marked: new () => { parse: (markdown: string) => string | Promise<string> }; parse: (markdown: string) => string | Promise<string> };
    DOMPurify: { sanitize: (html: string) => string };
  }
}

// Helper function for safe markdown rendering with fail-safe
export const renderMarkdownSafe = (markdown: string) => {
  try {
    // Check if dependencies are loaded
    if (!window.marked || !window.DOMPurify) {
      console.warn('Markdown dependencies not loaded. Rendering raw text.');
      return { __html: markdown || '' };
    }

    // Handle different versions of marked (instance vs static)
    let html: string | Promise<string> = '';
    
    if (window.marked.Marked) {
       const markedLocalInstance = new window.marked.Marked();
       html = markedLocalInstance.parse(markdown || '');
    } else if (typeof window.marked.parse === 'function') {
       html = window.marked.parse(markdown || '');
    } else {
       // Fallback for older/different versions
        html = (window.marked as any)(markdown || '');
    }

    // Handle async parse if necessary (though mostly sync for basic usage)
    if (typeof html !== 'string') {
       // In a real async scenario we might need a different approach, 
       // but for this utility we convert to string representation or handle sync only.
       // For safety in this specific UI implementation:
       return { __html: markdown || '' };
    }

    const sanitizedHtml = window.DOMPurify.sanitize(html);
    return { __html: sanitizedHtml };

  } catch (error) {
    console.error("Markdown rendering error:", error);
    // Fallback to raw text to prevent app crash
    return { __html: markdown || '' };
  }
};
