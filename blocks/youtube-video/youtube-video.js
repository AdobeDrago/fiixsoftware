const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

/**
 * Extracts a YouTube video ID from a supported YouTube URL.
 * @param {string} href A YouTube URL
 * @returns {string|null} The video ID, if valid
 */
function getVideoId(href) {
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' || !YOUTUBE_HOSTS.has(url.hostname)) return null;

    if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
    if (url.pathname.startsWith('/watch')) return url.searchParams.get('v');
    if (url.pathname.startsWith('/embed/')) return url.pathname.split('/').filter(Boolean)[1] || null;
    return null;
  } catch {
    return null;
  }
}

/**
 * Renders a responsive YouTube player from an authored YouTube URL.
 * @param {Element} block The YouTube video block
 */
export default function decorate(block) {
  const link = block.querySelector('a[href]');
  const videoId = link && getVideoId(link.href);
  const titleCell = block.querySelector(':scope > div > div:nth-child(2)');
  const title = titleCell?.textContent.trim()
    || (link?.textContent.trim() !== link?.href ? link?.textContent.trim() : '')
    || 'YouTube video player';

  if (!link || !videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
    block.classList.add('youtube-video-invalid');
    return;
  }

  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube.com/embed/${videoId}`;
  iframe.title = title;
  iframe.loading = 'lazy';
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
  iframe.allowFullscreen = true;
  block.replaceChildren(iframe);
}
