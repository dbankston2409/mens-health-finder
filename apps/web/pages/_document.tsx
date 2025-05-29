import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Work+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Preload external CSS for maps */}
        <link rel="preconnect" href="https://unpkg.com" crossOrigin="anonymous" />
        <link
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          rel="stylesheet"
        />
        <link
          href="https://unpkg.com/leaflet-defaulticon-compatibility@0.1.2/dist/leaflet-defaulticon-compatibility.css"
          rel="stylesheet"
        />
      </Head>
      <body className="bg-background text-textPrimary">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}