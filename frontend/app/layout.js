import Providers from "@/components/Providers";
import NavBar from "@/components/NavBar";

export const metadata = {
  title: "Blog Frontend",
  description: "Next.js + NextAuth on the Blog-App backend",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <Providers>
          <NavBar />
          <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
