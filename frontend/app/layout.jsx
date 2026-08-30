import "./globals.css";

export const metadata = {
  title: "UHF RFID Library Management System — TechNexusGen",
  description: "Complete RFID-powered library automation demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
