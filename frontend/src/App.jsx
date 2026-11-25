import { useEffect, useLayoutEffect, useState } from 'react';
import initial from './initialContent.json';
import './site.css';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Marquee from './components/Marquee.jsx';
import MobileMenu from './components/MobileMenu.jsx';
import Portfolio from './components/Portfolio.jsx';
import Services from './components/Services.jsx';
import Testimonials from './components/Testimonials.jsx';
import { startSiteEffects } from './siteEffects.js';

export default function App() {
  const [content, setContent] = useState();
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/content', { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(8000)]) })
      .then(response => response.ok ? response.json() : null)
      .then(setContent)
      .catch(() => { if (!controller.signal.aborted) setContent(null); });
    return () => controller.abort();
  }, []);

  useLayoutEffect(() => {
    if (content !== undefined) return startSiteEffects();
  }, [content]);

  const { services, works, clients } = content || initial;
  const about = { ...initial.about, ...content?.about };
  const settings = { ...initial.settings, ...content?.settings };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <div className="grain" aria-hidden="true" />
      <Header settings={settings} />
      <MobileMenu />
      <main id="main">
        <Hero settings={settings} />
        <Marquee />
        <Services services={services} settings={settings} />
        <About about={about} />
        <Portfolio works={works} settings={settings} />
        <Testimonials clients={clients} settings={settings} />
        <Contact settings={settings} services={services} />
      </main>
      <Footer settings={settings} />
    </>
  );
}
