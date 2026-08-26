import type { Metadata } from "next";
import { IBM_Plex_Mono, Nunito_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrefsProvider } from "@/contexts/PrefsContext";

const display = Source_Serif_4({
  variable: "--font-display-file",
  subsets: ["latin", "latin-ext"],
});

const body = Nunito_Sans({
  variable: "--font-body-file",
  subsets: ["latin", "latin-ext"],
});

const mono = IBM_Plex_Mono({
  variable: "--font-mono-file",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'OutPost by Nethorizon — programmatic outbound email',
  description:
    'Multi-tenant outbound email: Resend-compatible HTTPS API, tenant isolation, and MCP traffic tools.',
};

const prefsBootScript = `(function(){try{var t=localStorage.getItem('fr-theme');var l=localStorage.getItem('fr-locale');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');if(l==='de'||l==='hu'||l==='en')document.documentElement.lang=l;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: prefsBootScript }} />
      </head>
      <body>
        <PrefsProvider>
          <AuthProvider>{children}</AuthProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}
