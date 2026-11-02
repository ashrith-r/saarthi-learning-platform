export function safeMaterialUrl(value) {
  if (typeof value !== 'string' || value.length > 2000) return null;
  try { const url = new URL(value.trim()); return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function videoSource(value) {
  const safe = safeMaterialUrl(value);
  if (!safe) return null;
  const url = new URL(safe);
  const host = url.hostname.replace(/^www\./, '');
  if (['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
    const id = host === 'youtu.be' ? url.pathname.slice(1) : url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts|live)\/([^/?]+)/)?.[1];
    if (id && /^[\w-]{11}$/.test(id)) return { type: 'embed', url: `https://www.youtube-nocookie.com/embed/${id}` };
  }
  if (['vimeo.com', 'player.vimeo.com'].includes(host)) {
    const id = url.pathname.match(/(?:\/video)?\/(\d+)/)?.[1];
    if (id) return { type: 'embed', url: `https://player.vimeo.com/video/${id}` };
  }
  if (/\.(mp4|webm)$/i.test(url.pathname)) return { type: 'video', url: safe };
  return { type: 'link', url: safe };
}
export function validateMaterial(body, hasFile = false) {
  if (!['video', 'document', 'link'].includes(body.kind)) return 'Choose a material type.';
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 180) return 'Enter a title of 1–180 characters.';
  if (typeof body.description !== 'string' || body.description.length > 5000) return 'Description must be under 5,000 characters.';
  if (!hasFile && !safeMaterialUrl(body.url)) return 'Add a complete HTTP or HTTPS link, or upload a PDF.';
  if (hasFile && body.kind !== 'document') return 'PDF files belong to the document material type.';
  if ((body.instructor || '').length > 100 || (body.duration || '').length > 40) return 'Instructor or duration is too long.';
  return null;
}
