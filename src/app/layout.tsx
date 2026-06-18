import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PostHogPageView, PostHogProvider } from "@posthog/next";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agent Approval Desk",
  description:
    "Human-in-the-loop console for approving agent x402 micropayments.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const app = <AppShell>{children}</AppShell>;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        {posthogKey ? (
          <PostHogProvider
            apiKey={posthogKey}
            clientOptions={{
              api_host: "/ingest",
              person_profiles: "identified_only",
            }}
            bootstrapFlags
          >
            <PostHogPageView />
            {app}
          </PostHogProvider>
        ) : (
          app
        )}
      </body>
    </html>
  );
}
