export default function Hero({ settings }) {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title" data-testid="hero-section">
      <canvas id="field" aria-hidden="true"></canvas>
      <div className="orb a" aria-hidden="true"></div><div className="orb b" aria-hidden="true"></div>
      <div className="wrap hero-grid">
        <div>
          <p className="status fade-in d4" data-testid="hero-status"><i aria-hidden="true"></i>{settings.heroStatus}</p>
          <h1 className="h1" id="hero-title" data-testid="hero-title">
            <span className="ln"><span>{settings.heroLine1}</span></span>
            <span className="ln"><span className="grad">{settings.heroLine2}</span></span>
            <span className="ln"><span className="stroke">{settings.heroLine3}</span></span>
          </h1>
          <p className="hero-sub fade-in d1" data-testid="hero-subtitle">{settings.heroIntro}</p>
          <div className="hero-ctas fade-in d2">
            <a href="#contact" className="btn btn-primary magnetic" data-testid="hero-cta-consultation">Get Free Consultation <span className="arr" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6h10M6 1l5 5-5 5"/></svg></span></a>
            <a href="#work" className="btn btn-ghost magnetic" data-testid="hero-cta-work">See our work</a>
          </div>
          <dl className="hero-metrics fade-in d3" data-testid="hero-metrics">
            <div><dt><b>120+</b></dt><dd><span>products launched</span></dd></div>
            <div><dt><b>4.9/5</b></dt><dd><span>average client rating</span></dd></div>
            <div><dt><b>14 days</b></dt><dd><span>to first working release</span></dd></div>
          </dl>
        </div>
        <div className="stage fade-in d2" aria-hidden="true">
          <div className="tilt" id="tilt">
            <div className="frame"><img className="parallax-img" src={settings.heroImage || undefined} alt="" width="1100" height="733" fetchpriority="high" /><span className="frame-tag">Studio — sprint review</span></div>
            <div className="chip c1"><small>Lighthouse</small><strong>98</strong><span style={{"color":"var(--text-2)","fontSize":".8rem"}}> / 100</span></div>
            <div className="chip c2"><small>Organic traffic</small><strong>+212%</strong><div className="bars"><i style={{"height":"30%"}}></i><i style={{"height":"45%","animationDelay":".2s"}}></i><i style={{"height":"40%","animationDelay":".4s"}}></i><i style={{"height":"65%","animationDelay":".6s"}}></i><i style={{"height":"80%","animationDelay":".8s"}}></i><i style={{"height":"100%","animationDelay":"1s"}}></i></div></div>
          </div>
        </div>
      </div>
      <div className="scroll-hint" aria-hidden="true">SCROLL<i></i></div>
    </section>
  );
}
