import "@/assets/css/globals.css"
import { GoogleOAuthProvider } from '@react-oauth/google';

export const metadata = {
  title: "Agile AI Hub",
  description: "Empower your workflow with our cutting-edge AI tools. From CNIC extraction to Emirates ID processing and intelligent RAG chat, Agile AI Hub offers a suite of powerful, credit-based solutions to streamline your document analysis and enhance decision-making. Experience the future of AI-driven productivity today.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/Group-1.svg" sizes="32x32" />
        <link rel="icon" href="/Group-1.svg" sizes="192x192" />
        <link rel="apple-touch-icon" href="/Group-1.svg" />
      </head>
      <body className="bg-[#0a0118] scroll-smooth">
        <GoogleOAuthProvider clientId="924894828185-0b1ec6g3ofeud3pk3jsc47ce6alb3vv0.apps.googleusercontent.com">
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}