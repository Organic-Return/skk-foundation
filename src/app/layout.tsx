import type { Metadata } from "next";
import { Inter, Bodoni_Moda, Cormorant_Garamond, Montserrat, Playfair_Display, Figtree, Noto_Serif_Display } from "next/font/google";
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

// Noto Serif Display - display serif for h1-h3.
//
// Replaces Atacama, whose trial cut drew its figures at 85% of cap height with
// no OpenType feature to raise them, so numerals in an address sat visibly
// short beside the capitals. Noto Serif Display sets them at cap height
// (measured 1.009) and is close to Atacama in contrast and set width, so line
// breaks barely move. OFL licensed, so nothing to buy and no font files in the
// repo.
const notoSerifDisplay = Noto_Serif_Display({
  variable: "--font-noto-serif-display",
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  display: "swap",
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
      <body className={`${inter.variable} ${bodoni.variable} ${cormorantGaramond.variable} ${montserrat.variable} ${playfairDisplay.variable} ${figtree.variable} ${notoSerifDisplay.variable} antialiased ${templateClass}`}>
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
