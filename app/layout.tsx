import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JobTracker: Track Your Job Applications",
  description:
    "Track job applications, monitor your pipeline, and land your next role",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} h-full`}>
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily: "var(--font-inter), sans-serif",
          backgroundColor: "#F7F3EC",
          color: "#171717",
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}


// import type { Metadata } from "next";
// import { Inter, Manrope } from "next/font/google";
// import "./globals.css";

// const inter = Inter({
//   subsets: ["latin"],
//   variable: "--font-inter",
// });

// const manrope = Manrope({
//   subsets: ["latin"],
//   variable: "--font-manrope",
// });

// export const metadata: Metadata = {
//   title: "JobTracker",
//   description: "Track your applications, interviews, and offers in one place.",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className={`${inter.variable} ${manrope.variable} font-sans antialiased`}>
//         {children}
//       </body>
//     </html>
//   );
// }
