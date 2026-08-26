const nav = document.getElementById('nav');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen);
  });

  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll(
  '.about-card, .interest-card, .manual-card, .manual-cover, .journal-card, .tweet-card, .gallery-item, .connect-card'
).forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = `opacity 0.6s ease ${i * 0.05}s, transform 0.6s ease ${i * 0.05}s`;
  observer.observe(el);
});

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, ch => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[ch]));
}

function formatCount(n) {
  const num = Number(n) || 0;
  if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, '') + '万';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(num);
}

function tweetCardHTML(tweet) {
  const url = `https://x.com/RingSissy89044/status/${tweet.id}`;
  const isReply = tweet.type === 'reply';
  const media = Array.isArray(tweet.media) ? tweet.media : [];
  const mediaClass = media.length > 1 ? 'tweet-media tweet-media-2' : 'tweet-media';
  const mediaHTML = media.length
    ? `<div class="${mediaClass}">${media.map(src => {
        const href = src.startsWith('/') ? src : `/${src}`;
        return `<a href="${url}" target="_blank" rel="noopener"><img src="${href}" alt="推文配图 ${tweet.date}" loading="lazy"></a>`;
      }).join('')}</div>`
    : '';
  const badges = [];
  if (isReply && tweet.conversationId) {
    badges.push(`<a class="tweet-badge" href="https://x.com/i/web/status/${tweet.conversationId}" target="_blank" rel="noopener">回复</a>`);
  }
  if (tweet.hasVideo) {
    badges.push('<span class="tweet-badge">含视频 · 去 X 观看</span>');
  }
  const [y, m, d] = tweet.date.split('-');
  let timeLabel = `${y}.${m}.${d}`;
  if (tweet.createdAt) {
    const dt = new Date(tweet.createdAt);
    if (!Number.isNaN(dt.getTime())) {
      const hh = String(dt.getHours()).padStart(2, '0');
      const mm = String(dt.getMinutes()).padStart(2, '0');
      timeLabel = `${y}.${m}.${d} ${hh}:${mm}`;
    }
  }

  return `
    <article class="tweet-card${isReply ? ' tweet-card-reply' : ''}">
      <header class="tweet-meta">
        <img src="/public/avatar.jpg" alt="" class="tweet-avatar" width="40" height="40">
        <div class="tweet-meta-name">
          <strong>リン Rin</strong>
          <span>@RingSissy89044</span>
        </div>
        <time datetime="${tweet.createdAt || tweet.date}">${timeLabel}</time>
      </header>
      <p class="tweet-text">${escapeHtml(tweet.text)}</p>
      ${mediaHTML}
      ${badges.join('')}
      <footer class="tweet-footer">
        <span>♥ ${formatCount(tweet.likes)}</span>
        <span>↻ ${formatCount(tweet.reposts)}</span>
        <span>👁 ${formatCount(tweet.views)}</span>
        <a href="${url}" target="_blank" rel="noopener">在 X 查看 →</a>
      </footer>
    </article>
  `;
}

async function renderTweets() {
  const mounts = document.querySelectorAll('[data-tweets]');
  if (!mounts.length) return;

  try {
    const res = await fetch('/tweets.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(res.statusText);
    const data = await res.json();
    const all = Array.isArray(data.tweets) ? data.tweets : [];

    mounts.forEach(el => {
      const originalsOnly = el.getAttribute('data-tweets-originals') === 'true';
      const limit = Number(el.getAttribute('data-tweets-limit') || 0);
      let tweets = originalsOnly ? all.filter(t => t.type !== 'reply') : all;
      tweets = limit > 0 ? tweets.slice(0, limit) : tweets;
      if (!tweets.length) {
        el.innerHTML = '<p class="section-desc">暂时没有可展示的原创推文。</p>';
        return;
      }
      el.innerHTML = tweets.map(tweetCardHTML).join('');
      el.querySelectorAll('.tweet-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(24px)';
        card.style.transition = `opacity 0.6s ease ${i * 0.05}s, transform 0.6s ease ${i * 0.05}s`;
        observer.observe(card);
      });
    });
  } catch (err) {
    mounts.forEach(el => {
      el.innerHTML = '<p class="section-desc">推文同步失败，请直接去 <a href="https://x.com/RingSissy89044" target="_blank" rel="noopener">X @RingSissy89044</a> 查看。</p>';
    });
  }
}

renderTweets();