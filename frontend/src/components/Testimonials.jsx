function Stars({ rating, clientId }) {
  const half = rating % 1 !== 0;
  const gradient = 'rating-' + clientId;
  return (
    <div className="stars" role="img" aria-label={rating + ' out of 5 stars'}>
      {Array.from({ length: Math.ceil(rating) }, (_, index) => {
        const partial = half && index === Math.floor(rating);
        return (
          <svg key={index} viewBox="0 0 24 24" aria-hidden="true" fill={partial ? 'url(#' + gradient + ')' : 'currentColor'}>
            {partial && <defs><linearGradient id={gradient}>
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="rgba(255,184,0,.25)" />
            </linearGradient></defs>}
            <path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z" />
          </svg>
        );
      })}
    </div>
  );
}

export default function Testimonials({ clients, settings }) {
  const logos = [...new Set([...settings.clientLogos.split(",").map(name => name.trim()), ...clients.map(client => client.company)].filter(Boolean))];
  return (
    <section className="sec tsec" id="testimonials" aria-labelledby="t-title" data-testid="testimonials-section">
      <div className="big-q" aria-hidden="true">“</div>
      <div className="wrap">
        <div data-reveal="">
          <span className="eyebrow">04 — Client voices</span>
          <h2 className="h2" id="t-title" style={{"marginBottom":"clamp(2.5rem,5vw,4rem)"}}>{settings.clientsHeading} <em>{settings.clientsEmphasis}</em> {settings.clientsHeadingEnd}</h2>
        </div>
        {clients.length > 0 && <div className="slider" id="slider" role="region" aria-roledescription="carousel" aria-label="Client testimonials" data-reveal="">
          <div className="s-ctrl">
            <p className="count" aria-hidden="true"><b id="s-cur">01</b> / {String(clients.length).padStart(2, "0")}</p>
            <div className="arrows">
              <button type="button" id="s-prev" aria-label="Previous testimonial" data-testid="testimonial-prev"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 8H1M6 3L1 8l5 5"/></svg></button>
              <button type="button" id="s-next" aria-label="Next testimonial" data-testid="testimonial-next"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 8h14M10 3l5 5-5 5"/></svg></button>
            </div>
            <div className="dots" id="s-dots" role="group" aria-label="Choose testimonial"></div>
          </div>
          <div className="slides" aria-live="polite">
            {clients.map((client, index) => (
              <figure key={client._id} className={"slide" + (index === 0 ? " is-active" : "")} data-testid={"testimonial-" + (index + 1)}>
                <Stars rating={client.rating} clientId={client._id} />
                {client.quote && <blockquote>{"\u201c"}{client.quote}{"\u201d"}</blockquote>}
                <figcaption className="who">
                  {client.image ? <img src={client.image} alt="" width="56" height="56" loading="lazy" />
                    : <span className="mono" aria-hidden="true">{client.name.split(/\s+/).slice(0, 2).map(name => name[0]).join("").toUpperCase()}</span>}
                  <div><b>{client.name}</b><span>{[client.role, client.company].filter(Boolean).join(", ")}</span></div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>}
        <div className="logos" aria-label="Clients we have worked with" data-reveal="">
          {logos.map(name => <span key={name}>{name}</span>)}
        </div>
      </div>
    </section>
  );
}
