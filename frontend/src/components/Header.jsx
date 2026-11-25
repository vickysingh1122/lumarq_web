import BrandMark from './BrandMark.jsx';

export default function Header({ settings }) {
  return (
    <header className="nav" id="nav" data-testid="site-header">
      <div className="wrap nav-in">
        <a href="#top" className="brand" aria-label={settings.name + " home"} data-testid="nav-logo">
          <BrandMark settings={settings} />
        </a>
        <nav aria-label="Primary">
          <ul className="nav-links">
            <li><a href="#services" data-testid="nav-link-services">Services</a></li>
            <li><a href="#about" data-testid="nav-link-about">About</a></li>
            <li><a href="#work" data-testid="nav-link-work">Work</a></li>
            <li><a href="#testimonials" data-testid="nav-link-testimonials">Clients</a></li>
          </ul>
        </nav>
        <a href="#contact" className="btn btn-primary nav-cta" data-testid="nav-cta-button">Free consultation</a>
        <button className="burger" id="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mmenu" data-testid="mobile-menu-toggle"><span></span><span></span></button>
      </div>
    </header>
  );
}
