// Clipboard with a graceful fallback: the async API first, then a hidden
// textarea, and if both fail the caller shows the text for manual copying.
export async function copyText(text, doc = document) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or unavailable: fall through to the legacy path.
  }
  try {
    const ta = doc.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    doc.body.appendChild(ta);
    ta.select();
    const ok = doc.execCommand && doc.execCommand('copy');
    ta.remove();
    return !!ok;
  } catch {
    return false;
  }
}

/** The attributed summary visitors copy: text, organisation, primary source. */
export function summaryText(story, sources, link) {
  const primary = sources[story.sources[0]];
  return `${story.title}\n\n${story.shareSummary}\n\nSource: ${primary.publisher}, ${primary.url}\nStory: ${link}`;
}
