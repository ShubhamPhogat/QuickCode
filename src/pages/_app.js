// File: pages/_app.js
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <SessionProvider session={pageProps.session}>
      <ThemeProvider attribute="class" defaultTheme="dark">
        <AnimatePresence mode="wait" initial={false}>
          <Component {...pageProps} key={pageProps.router?.asPath || ""} />
        </AnimatePresence>
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;
