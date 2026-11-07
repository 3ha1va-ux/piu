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
  title: "იპოვე — დაკარგული შინაური ცხოველების პლატფორმა",
  description:
    "იპოვე აერთიანებს მთელ საქართველოს დაკარგული, ჩუქდება და ნაპოვნი კატებისა და ძაღლების საძიებლად.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "იპოვე",
  },
  formatDetection: {
    telephone: false,
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
