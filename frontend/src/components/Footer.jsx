import BrandMark from './BrandMark.jsx';

export default function Footer({ settings }) {
  return (
    <footer className="footer" data-testid="site-footer">
      <div className="wrap">
        <div className="f-grid">
          <div className="f-about">
            <a href="#top" className="brand" aria-label={"Back to top — " + settings.name}>
              <BrandMark settings={settings} />
            </a>
            <p>Senior engineers and designers building websites, mobile apps and search growth for ambitious teams.</p>
            <div className="socials">
              <a href="#" aria-label="Lumarq on LinkedIn" data-testid="social-linkedin"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05C20.6 8.65 21 11.2 21 14.5V21h-4v-5.8c0-1.4-.03-3.2-1.95-3.2-1.95 0-2.25 1.52-2.25 3.1V21H9z"/></svg></a>
              <a href="#" aria-label="Lumarq on GitHub" data-testid="social-github"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.9 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"/></svg></a>
              <a href="#" aria-label="Lumarq on X" data-testid="social-x"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.75 3h3.07l-6.7 7.66L22 21h-6.17l-4.83-6.32L5.47 21H2.4l7.17-8.2L2 3h6.33l4.37 5.78zm-1.08 16.2h1.7L7.4 4.7H5.58z"/></svg></a>
              <a href="#" aria-label="Lumarq on Dribbble" data-testid="social-dribbble"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3.6 9.5c5 .3 10.5-.8 14.6-4.2M8 3.9c3 3.8 5.3 9.6 6.3 16.6M3.3 13.5c4.7-2.6 11.2-3.4 17.6-1.4"/></svg></a>
            </div>
          </div>
          <nav aria-label="Quick links">
            <h4>Quick links</h4>
            <ul><li><a href="#services">Services</a></li><li><a href="#about">About us</a></li><li><a href="#work">Our work</a></li><li><a href="#testimonials">Testimonials</a></li><li><a href="#contact">Contact</a></li></ul>
          </nav>
          <nav aria-label="Services">
            <h4>Services</h4>
            <ul><li><a href="#services">Website development</a></li><li><a href="#services">Mobile apps</a></li><li><a href="#services">SEO &amp; growth</a></li><li><a href="#services">Cloud &amp; DevOps</a></li><li><a href="#services">UI/UX design</a></li></ul>
          </nav>
          <div>
            <h4>Contact</h4>
            <ul className="f-contact" data-testid="footer-contact">
              {settings.email && <li><a href={"mailto:" + settings.email}>{settings.email}</a></li>}
              {settings.phone && <li><a href={"tel:" + settings.phone}>{settings.phone === "+10000000000" ? "[+1 000 000 0000]" : settings.phone}</a></li>}
              {settings.address && <li>{settings.address}</li>}
              {settings.hours && <li>{settings.hours}</li>}
            </ul>
          </div>
        </div>
        <p className="wordmark" aria-hidden="true">{settings.name === "Lumarq Digital" ? "Lumarq" : settings.name}</p>
        <div className="f-bottom">
          <span>© <span id="year">{new Date().getFullYear()}</span> {settings.name}. All rights reserved.</span>
          <span><a href="#">Privacy policy</a> · <a href="#">Terms</a></span>
          <button className="top-btn" id="to-top" type="button" data-testid="back-to-top">Back to top ↑</button>
        </div>
      </div>
    </footer>
  );
}
