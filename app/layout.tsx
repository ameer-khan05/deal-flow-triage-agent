import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deal Flow Triage Agent",
  description: "Automated signal collection, scoring, and deal surfacing",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
