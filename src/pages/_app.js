// File: pages/_app.js
import { ThemeProvider } from "next-themes";
import { AnimatePresence } from "framer-motion";
import "../styles/globals.css";

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <AnimatePresence mode="wait" initial={false}>
        <Component {...pageProps} key={pageProps.router?.asPath || ""} />
      </AnimatePresence>
    </ThemeProvider>
  );
}

export default MyApp;
