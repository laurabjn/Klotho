/** Advertising pixels of the website, each one only when configured. */
export interface SitePixels {
  /** Meta (Facebook, Instagram) pixel id: digits. */
  meta?: string;
  /** TikTok pixel id. */
  tiktok?: string;
  /** Google Ads tag: AW-123456789. */
  googleAds?: string;
  /** Google Ads conversion label of the Play Store click. */
  googleAdsLabel?: string;
  /** Pinterest tag id: digits. */
  pinterest?: string;
}

export interface SiteSettings {
  contactEmail: string;
  /** Google Search Console proof that the site is ours. */
  siteVerification?: string;
  /** The app is on Google Play: the download button replaces "soon". */
  playStoreLive: boolean;
  pixels: SitePixels;
}

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.laurabjn.klotho';

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
] as const;

/**
 * The Play Store link, carrying the campaign of the visit (utm_… of the ad
 * link) so that Google Play attributes the installs to it.
 */
export function playStoreLink(query: Record<string, unknown>): string {
  const utm = new URLSearchParams();
  for (const key of UTM_KEYS) {
    const value = query[key];
    if (typeof value === 'string' && /^[\w.-]{1,100}$/.test(value))
      utm.set(key, value);
  }
  const referrer = utm.toString();
  return referrer
    ? `${PLAY_STORE_URL}&referrer=${encodeURIComponent(referrer)}`
    : PLAY_STORE_URL;
}

export const hasPixels = (pixels: SitePixels) =>
  !!(pixels.meta || pixels.tiktok || pixels.googleAds || pixels.pinterest);

// The ids are checked when the configuration is read (env.ts); JSON.stringify
// keeps them inert in the script anyway.
const id = (value: string) => JSON.stringify(value);

function loaders(pixels: SitePixels): string {
  const parts: string[] = [];
  if (pixels.meta)
    parts.push(
      `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${id(pixels.meta)});fbq('track','PageView');`,
    );
  if (pixels.tiktok)
    parts.push(
      `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load(${id(pixels.tiktok)});ttq.page()}(window,document,'ttq');`,
    );
  if (pixels.googleAds)
    parts.push(
      `var g=document.createElement('script');g.async=!0;g.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(${id(pixels.googleAds)});document.head.appendChild(g);window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};gtag('js',new Date());gtag('config',${id(pixels.googleAds)});`,
    );
  if (pixels.pinterest)
    parts.push(
      `!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[];n.version="3.0";var t=document.createElement("script");t.async=!0;t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load',${id(pixels.pinterest)});pintrk('page');`,
    );
  return parts.join('\n');
}

/** The click on the Play Store button, sent to every accepted platform. */
function storeClick(pixels: SitePixels): string {
  const sendTo =
    pixels.googleAds && pixels.googleAdsLabel
      ? id(`${pixels.googleAds}/${pixels.googleAdsLabel}`)
      : 'null';
  return `function storeClick(){if(window.fbq)fbq('trackCustom','PlayStoreClick');if(window.ttq)ttq.track('ClickButton');if(window.gtag&&${sendTo})gtag('event','conversion',{send_to:${sendTo}});if(window.pintrk)pintrk('track','lead');}`;
}

/** 6 months, as the CNIL recommends for a consent choice. */
const CONSENT_MS = 182 * 24 * 60 * 60 * 1000;

/**
 * Consent banner and the script that loads the pixels only after "Accepter";
 * nothing at all when no pixel is configured. Accept and refuse are equal.
 */
export function consentBlock(
  pixels: SitePixels,
  texts: {
    text: string;
    accept: string;
    refuse: string;
    more: string;
  },
  privacyHref: string,
  escape: (text: string) => string,
): string {
  if (!hasPixels(pixels)) return '';
  return `<div class="consent" id="consent" role="dialog" aria-live="polite" aria-label="Cookies" hidden>
  <p>${escape(texts.text)} <a href="${privacyHref}">${escape(texts.more)}</a></p>
  <div class="consent-actions">
    <button type="button" id="consent-refuse">${escape(texts.refuse)}</button>
    <button type="button" id="consent-accept">${escape(texts.accept)}</button>
  </div>
</div>
<script>
(function(){
  var KEY='klotho-consent', MAX=${CONSENT_MS}, box=document.getElementById('consent');
  var loaded=false;
  ${storeClick(pixels)}
  function load(){if(loaded)return;loaded=true;
${loaders(pixels)}
  }
  function read(){try{var v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&Date.now()-v.at<MAX)return v.choice}catch(e){}return null}
  function save(choice){try{localStorage.setItem(KEY,JSON.stringify({choice:choice,at:Date.now()}))}catch(e){}
    box.hidden=true;if(choice==='yes')load();}
  document.getElementById('consent-accept').addEventListener('click',function(){save('yes')});
  document.getElementById('consent-refuse').addEventListener('click',function(){save('no')});
  var manage=document.getElementById('manage-cookies');
  if(manage)manage.addEventListener('click',function(e){e.preventDefault();box.hidden=false});
  var links=document.querySelectorAll('[data-store]');
  for(var i=0;i<links.length;i++)links[i].addEventListener('click',function(){if(loaded)storeClick()});
  var choice=read();
  if(choice==='yes')load();else if(choice===null)box.hidden=false;
})();
</script>`;
}

export const CONSENT_STYLE = `
.consent { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 20;
  max-width: 720px; margin: 0 auto; background: var(--surface); color: var(--body);
  border: 1px solid var(--line); border-radius: 20px; padding: 18px 20px;
  box-shadow: 0 12px 32px rgba(62, 35, 28, .15); font-size: 15px; }
.consent[hidden] { display: none; }
.consent p { margin: 0 0 12px; }
.consent-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
.consent button { font: 500 15px 'Jost', sans-serif; border-radius: 999px;
  padding: 10px 22px; cursor: pointer; border: 1px solid var(--rose);
  background: var(--rose); color: #FFF9F5; min-width: 120px; }
`;
