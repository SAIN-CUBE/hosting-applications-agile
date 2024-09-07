import "@/assets/css/globals.css"

export const metadata = {
  title: "Agile AI Hub",
  description: "Empower your workflow with our cutting-edge AI tools. From CNIC extraction to Emirates ID processing and intelligent RAG chat, Agile AI Hub offers a suite of powerful, credit-based solutions to streamline your document analysis and enhance decision-making. Experience the future of AI-driven productivity today.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0118] scroll-smooth">{children}</body>
    </html>
  );
}
