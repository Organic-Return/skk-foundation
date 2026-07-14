import Script from 'next/script';
import {
  getFacebookPixelId,
  getGoogleAnalyticsId,
  getGoogleTagManagerId,
} from '@/lib/settings';

/**
 * Analytics tags, driven entirely by Sanity settings.
 *
 * lib/settings has had getGoogleAnalyticsId(), getGoogleTagManagerId() and
 * getFacebookPixelId() all along — nothing ever rendered them, so the site
 * shipped with no analytics at all regardless of what was configured. Each tag
 * renders only when its ID is set, so an unconfigured tenant emits nothing.
 *
 * afterInteractive: analytics must not block the hero render.
 */
export default async function Analytics() {
  const [gaId, gtmId, pixelId] = await Promise.all([
    getGoogleAnalyticsId(),
    getGoogleTagManagerId(),
    getFacebookPixelId(),
  ]);

  if (!gaId && !gtmId && !pixelId) return null;

  return (
    <>
      {gtmId && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${gaId}');`}
          </Script>
        </>
      )}

      {pixelId && (
        <Script id="fb-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
        </Script>
      )}
    </>
  );
}
