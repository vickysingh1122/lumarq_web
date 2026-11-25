import initial from '../initialContent.json';

const icons = [
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14l-2 2 2 2M16 14l2 2-2 2"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8.5 12l2-2 2 1.5 2-3"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M7 18a4 4 0 0 1-.5-7.97A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9H7z"/><path d="M12 12v4M10 14h4"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/></svg>,
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></svg>,
];

export default function Services({ services, settings }) {
  return (
    <section className="sec" id="services" aria-labelledby="services-title" data-testid="services-section">
      <div className="wrap">
        <div className="sec-head">
          <div data-reveal="">
            <span className="eyebrow">01 — Services</span>
            <h2 className="h2" id="services-title">{settings.servicesHeading}<br/><em>{settings.servicesEmphasis}</em></h2>
          </div>
          <p className="lede" data-reveal="" data-delay=".1">{settings.servicesIntro}</p>
        </div>
    
        <div className="bento">
          {services.map((service, index) => {
            const slot = initial.services.findIndex(item => item._id === service._id);
            const template = initial.services[slot];
            const icon = <div className="ico" aria-hidden="true">{icons[slot] || icons[0]}</div>;
            const copy = <>{slot === 2 ? <div className="card-top">{icon}</div> : icon}
              <h3>{service.name}</h3><p>{service.description}</p></>;
            const metric = service.metric && <div><p className="metric">{service.metric}</p><small>{service.metricLabel}</small></div>;
            return (
              <article key={service._id} className={"card " + (template?.style || "")} data-reveal=""
                data-delay={[0, .08, 0, .08, .16, 0][index % 6] || undefined}
                data-testid={"service-card-" + (template?.slug || service._id)}>
                {slot === 0 ? <div className="split"><div>{copy}</div>{metric}</div> : <>{copy}{metric}</>}
                {service.image && <div className="card-media"><img src={service.image} alt={service.alt} loading="lazy" width="1100" height="733" /></div>}
                {service.tags && <ul className="tags">{service.tags.split(",").map((tag, i) => <li key={i}>{tag.trim()}</li>)}</ul>}
              </article>
            );
          })}
          <a href="#contact" className="card s-cta" data-reveal="" data-delay=".08" data-testid="service-card-cta">
            <span className="eyebrow" style={{"color":"var(--bg)"}}>Not sure where to start?</span>
            <h3 style={{"marginTop":"1rem"}}>Get a free 30-minute technical roadmap call.</h3>
            <p>We’ll map your goals to the smallest build that proves them.</p>
            <span className="go">Book the call <svg width="18" height="12" viewBox="0 0 18 12" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 6h16M12 1l5 5-5 5"/></svg></span>
          </a>
        </div>
      </div>
    </section>
  );
}
