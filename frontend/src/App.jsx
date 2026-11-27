import { useEffect, useRef, useState } from 'react';
import { getPublicContent } from './publicContent.js';
import { notFound, pages } from './sitePages.js';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import { CompanyPage, ContactPage, HomePage, NotFoundPage, PrivacyPage, ServicesPage, WorkPage } from './components/MarketingPages.jsx';
import './site.css';

const views = {
  '/': HomePage,
  '/services': ServicesPage,
  '/work': WorkPage,
  '/about': CompanyPage,
  '/contact': ContactPage,
  '/privacy': PrivacyPage,
};

export default function App() {
  const [content, setContent] = useState(null);
  const scrolledToFragment = useRef(false);
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const View = views[path] ?? NotFoundPage;
  const metadata = pages[path] ?? notFound;

  useEffect(() => {
    document.title = metadata.title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata.description);
    const controller = new AbortController();
    fetch('/api/content', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setContent(data); })
      .catch(() => {
        // The public site can still render with the bundled content.
      });
    return () => controller.abort();
  }, [metadata]);

  useEffect(() => {
    if (scrolledToFragment.current) return;
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      scrolledToFragment.current = true;
      target.scrollIntoView();
    }
  }, [content]);

  const publicContent = getPublicContent(content);

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Header settings={publicContent.settings} path={path} />
      <main id="main" tabIndex={-1}><View {...publicContent} /></main>
      <Footer settings={publicContent.settings} />
    </>
  );
}
