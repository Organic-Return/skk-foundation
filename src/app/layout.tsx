import type { Metadata } from "next";
import { Inter, Bodoni_Moda, Cormorant_Garamond, Montserrat, Playfair_Display, Figtree } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/components/Header";
import LuxuryHeader from "@/components/LuxuryHeader";
import ModernHeader from "@/components/ModernHeader";
import RCSothebysHeader from "@/components/RCSothebysHeader";
import Footer from "@/components/Footer";
import ModernFooter from "@/components/ModernFooter";
import LuxuryStayConnected from "@/components/LuxuryStayConnected";
import RCSothebysFooter from "@/components/RCSothebysFooter";
import LayoutWrapper from "@/components/LayoutWrapper";
import { AuthProvider } from "@/components/AuthProvider";
import UTMCapture from "@/components/UTMCapture";
import Analytics from "@/components/Analytics";
import { getSettings, getBranding, getBaseUrl } from "@/lib/settings";
import { getMainNavigation, getFooterNavigation, groupFooterLinks } from "@/lib/navigation";
import { getAllCommunities } from "@/lib/homepage";

// Inter - Clean, modern sans-serif for body text
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// Bodoni Moda - Elegant serif for headings
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Cormorant Garamond - Elegant serif for luxury template (fallback for Atacama)
const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Montserrat - Modern geometric sans-serif for modern template
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
});

// Figtree - Modern sans-serif for RCSothebys template
const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["300", "400", "500", "800", "900"],
  display: "swap",
});

// Playfair Display - High-contrast Didot-style serif for luxury template
const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Atacama - Premium display serif used for h1/h2.
//
// Both files are variable fonts carrying a wght axis of 100-900 (plus wdth and
// CNTR), so one file covers the whole weight range and `font-light` on a
// heading now resolves to a real 300 rather than being ignored.
//
// The directory is `public/Fonts` with a capital F. macOS is case-insensitive
// so `public/fonts` resolves locally, but the Vercel build runs on Linux where
// it does not — the casing here has to match the repo exactly.
const atacama = localFont({
  src: [
    { path: '../../public/Fonts/Atacama Trial VAR-VF.ttf', weight: '100 900', style: 'normal' },
    { path: '../../public/Fonts/Atacama Italic Trial VAR-VF.ttf', weight: '100 900', style: 'italic' },
  ],
  variable: '--font-atacama',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const [settings, baseUrl] = await Promise.all([getSettings(), getBaseUrl()]);
  const siteName = settings?.title || 'Real Estate';
  const description = settings?.description;

  return {
    metadataBase: new URL(baseUrl),
    // A bare default, not a template: most pages build fully-branded titles of
    // their own (often from Sanity `seo.metaTitle`), and a template would
    // double up the brand.
    title: siteName,
    description,
    keywords: settings?.seo?.keywords,
    openGraph: {
      type: 'website',
      siteName,
      url: baseUrl,
      title: siteName,
      description,
    },
    twitter: { card: 'summary_large_image', title: siteName, description },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch settings and navigation
  const [settings, branding, mainNav, footerNav, communities] = await Promise.all([
    getSettings(),
    getBranding(),
    getMainNavigation(),
    getFooterNavigation(),
    getAllCommunities(20),
  ]);

  const footerColumns = groupFooterLinks(footerNav);
  const envTemplate = process.env.NEXT_PUBLIC_SITE_TEMPLATE;
  const template = settings?.template || envTemplate || 'classic';
  const communityNames = (communities || []).map((c: any) => c.title).filter(Boolean) as string[];

  // Render appropriate header based on template
  const renderHeader = () => {
    if (template === 'luxury') {
      return (
        <LuxuryHeader
          logo={branding?.logo}
          logoAlt={branding?.logoAlt || settings?.title}
          siteTitle={settings?.title}
          navItems={mainNav}
          phoneNumber={settings?.contactInfo?.phone}
          email={settings?.contactInfo?.email}
        />
      );
    }
    if (template === 'modern' || template === 'custom-one') {
      return (
        <ModernHeader
          logo={branding?.logo}
          logoAlt={branding?.logoAlt || settings?.title}
          siteTitle={settings?.title}
          navItems={mainNav}
          phoneNumber={settings?.contactInfo?.phone}
          email={settings?.contactInfo?.email}
        />
      );
    }
    if (template === 'rcsothebys-custom') {
      return (
        <RCSothebysHeader
          logo={branding?.logo}
          logoAlt={branding?.logoAlt || settings?.title}
          siteTitle={settings?.title}
          navItems={mainNav}
          phoneNumber={settings?.contactInfo?.phone}
          email={settings?.contactInfo?.email}
        />
      );
    }
    return (
      <Header
        logo={branding?.logo}
        logoAlt={branding?.logoAlt || settings?.title}
        siteTitle={settings?.title}
        navItems={mainNav}
      />
    );
  };

  // Determine template-specific body class
  const templateClass = template === 'modern' ? 'modern-template' : template === 'custom-one' ? 'custom-one-template' : template === 'luxury' ? 'luxury-template' : template === 'rcsothebys-custom' ? 'rcsothebys-template' : '';

  return (
    <html lang="en">
      <body className={`${inter.variable} ${bodoni.variable} ${cormorantGaramond.variable} ${montserrat.variable} ${playfairDisplay.variable} ${figtree.variable} ${atacama.variable} antialiased ${templateClass}`}>
        <Analytics />
        <AuthProvider>
        <UTMCapture />
        <LayoutWrapper
          header={renderHeader()}
          template={template}
          footer={
            template === 'luxury' ? (
              <LuxuryStayConnected
                logo={branding?.logo}
                logoAlt={branding?.logoAlt || settings?.title}
                siteTitle={settings?.title}
                columns={footerColumns}
                socialMedia={settings?.socialMedia}
                contactInfo={settings?.contactInfo}
              />
            ) : template === 'rcsothebys-custom' ? (
              <RCSothebysFooter
                logo={branding?.logo}
                logoAlt={branding?.logoAlt || settings?.title}
                siteTitle={settings?.title}
                columns={footerColumns}
                socialMedia={settings?.socialMedia}
                contactInfo={settings?.contactInfo}
                footer={settings?.footer}
                cities={communityNames}
              />
            ) : template === 'custom-one' ? (
              <ModernFooter
                logo={branding?.logo}
                logoAlt={branding?.logoAlt || settings?.title}
                siteTitle={settings?.title}
                columns={footerColumns}
                socialMedia={settings?.socialMedia}
                contactInfo={settings?.contactInfo}
                footer={settings?.footer}
              />
            ) : (
              <Footer
                logo={branding?.logo}
                logoAlt={branding?.logoAlt || settings?.title}
                siteTitle={settings?.title}
                description={settings?.description}
                columns={footerColumns}
                socialMedia={settings?.socialMedia}
                contactInfo={settings?.contactInfo}
                footer={settings?.footer}
              />
            )
          }
        >
          {children}
        </LayoutWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
