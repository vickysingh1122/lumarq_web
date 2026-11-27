import { useState } from 'react';
import BrandMark from './BrandMark.jsx';
import { navigation, pages } from '../sitePages.js';

export default function Header({ settings, path }) {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeOnEscape(event) {
    if (menuOpen && event.key === 'Escape') {
      setMenuOpen(false);
      event.currentTarget.querySelector('.menu-toggle').focus();
    }
  }

  return (
    <header className="site-header" onKeyDown={closeOnEscape} data-testid="site-header">
      <div className="wrap header-inner">
        <a href="/" className="brand" aria-label={settings.name + ' home'}><BrandMark settings={settings} /></a>
        <button className="menu-toggle" type="button" aria-controls="site-nav" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? 'Close' : 'Menu'}
        </button>
        <nav id="site-nav" aria-label="Main navigation" className={menuOpen ? 'site-nav is-open' : 'site-nav'}>
          {navigation.map(href => <a key={href} href={href} aria-current={path === href ? 'page' : undefined}>{pages[href].label}</a>)}
        </nav>
        <a href="/contact#lead-form" className="btn btn-dark header-cta">Start a project</a>
      </div>
    </header>
  );
}
