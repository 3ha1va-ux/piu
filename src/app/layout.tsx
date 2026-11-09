import type { Metadata, Viewport } from "next";
import { Noto_Sans_Georgian, Noto_Serif_Georgian } from "next/font/google";
import { UserAuthProvider } from "@/lib/userAuthContext";
import AuthModal from "@/components/auth/AuthModal";
import TelemetryCollector from "@/components/TelemetryCollector";
import "./globals.css";

const body = Noto_Sans_Georgian({
  variable: "--font-body",
  subsets: ["georgian", "latin"],
  weight: ["400", "500", "600", "700"],
});

const display = Noto_Serif_Georgian({
  variable: "--font-display",
  subsets: ["georgian", "latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://piu.ge"),
  title: {
    default: "piu.ge — დაკარგული და ნაპოვნი ცხოველები საქართველოში",
    template: "%s — piu.ge",
  },
  description:
    "piu.ge არის დაკარგული, ნაპოვნი და გასაჩუქებელი შინაური ცხოველების პირველი ინტერაქციული პლატფორმა საქართველოში. იპოვეთ თქვენი ოთხფეხა მეგობარი რუკაზე.",
  keywords: [
    "piu.ge",
    "piu",
    "პიუ",
    "დაკარგული ცხოველები",
    "დაკარგული ძაღლი",
    "დაკარგული კატა",
    "ნაპოვნი ცხოველები",
    "ცხოველების ჩუქება",
    "ცხოველთა დაცვა საქართველო",
    "შინაური ცხოველები რუკაზე",
  ],
  authors: [{ name: "piu.ge" }],
  creator: "piu.ge",
  publisher: "piu.ge",
  openGraph: {
    type: "website",
    locale: "ka_GE",
    url: "https://piu.ge",
    siteName: "piu.ge",
    title: "piu.ge — დაკარგული და ნაპოვნი ცხოველები საქართველოში",
    description:
      "დაკარგული, ნაპოვნი და გასაჩუქებელი ძაღლებისა და კატების ინტერაქციული რუკა საქართველოში.",
    images: [
      {
        url: "https://piu.ge/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "piu.ge — დაკარგული ცხოველების პლატფორმა",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "piu.ge — დაკარგული და ნაპოვნი ცხოველები საქართველოში",
    description:
      "დაკარგული, ნაპოვნი და გასაჩუქებელი ძაღლებისა და კატების ინტერაქციული რუკა საქართველოში.",
    images: ["https://piu.ge/og-image.jpg"],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "piu.ge",
  },
  formatDetection: {
    telephone: false,
  },
  alternates: {
    canonical: "https://piu.ge",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1f4a3a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ka"
      className={`${body.variable} ${display.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              function kill(){
                var f=document.querySelectorAll('#nl-badge-frame,#nl-hud-frame,iframe[title*="Netlify"]');
                for(var i=0;i<f.length;i++){f[i].remove();}
              }
              kill();
              var observer=new MutationObserver(kill);
              observer.observe(document.documentElement,{childList:true,subtree:true});
            })();`,
          }}
        />
        <UserAuthProvider>
          {children}
          <AuthModal />
          <TelemetryCollector />
        </UserAuthProvider>
      </body>
    </html>
  );
}
