import type { ReactNode } from "react";
export const metadata = { title: "Vibloid" };
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui", margin: 0, background: "#0b0d10", color: "#e8eaed" }}>{children}</body>
    </html>
  );
}
