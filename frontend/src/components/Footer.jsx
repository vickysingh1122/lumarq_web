import BrandMark from './BrandMark.jsx';
import { navigation, pages } from '../sitePages.js';

export default function Footer({ settings }) {
  return (
    <footer className="footer" data-testid="site-footer">
      <div className="wrap">
        <div className="footer-main">
          <div>
            <a href="/" className="brand" aria-label={settings.name + ' home'}><BrandMark settings={settings} /></a>
            <p>Design, engineering and growth for digital products.</p>
          </div>
          <nav aria-label="Footer navigation">
            {navigation.map(href => <a key={href} href={href}>{pages[href].label}</a>)}
          </nav>
          <div className="footer-contact">
            {settings.email && <a href={'mailto:' + settings.email}>{settings.email}</a>}
            {settings.phone && <a href={'tel:' + settings.phone}>{settings.phone}</a>}
            {settings.address && <span>{settings.address}</span>}
            {settings.hours && <span>{settings.hours}</span>}
            <a className="btn btn-primary" href="/contact#lead-form">Start a project</a>
          </div>
        </div>
        <div className="footer-bottom">
          <small>© {new Date().getFullYear()} {settings.name}</small>
          <a href="/privacy">Privacy notice</a>
        </div>
      </div>
    </footer>
  );
}
