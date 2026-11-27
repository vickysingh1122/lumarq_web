import Contact from './Contact.jsx';
import Portfolio from './Portfolio.jsx';
import Services from './Services.jsx';

const approach = [
  ['Discover', 'We clarify your goals, audience and constraints, then agree on what the first release needs to do.'],
  ['Design', 'We turn the brief into flows and prototypes so you can review the experience before development.'],
  ['Build', 'We implement and test the agreed scope, sharing working progress for feedback along the way.'],
  ['Launch & support', 'We prepare the release, walk you through the handover and discuss any ongoing support you need.'],
];

const engagements = [
  ['Launching a new product', 'Turn a brief into a website, app or first product release with a clear scope.'],
  ['Improving an existing platform', 'Prioritise fixes and upgrades for usability, content, performance or search.'],
  ['Extending your team', 'Bring in design, engineering, SEO or cloud expertise for a defined piece of work.'],
];

const faqs = [
  ['What should I include in my enquiry?', 'Tell us your goal, who the product is for, what already exists and when you hope to launch. A link or a short description is enough to start.'],
  ['Can I reach out without a fixed budget?', 'Yes. Leave the budget blank or select “Not sure yet”. We can discuss what to prioritise and which parts of the project can be phased.'],
  ['Can you work on an existing website or app?', 'Yes. Share what you want to improve and any constraints around the current platform. We’ll discuss which changes make sense before scoping the work.'],
  ['What happens after I submit the form?', 'We review your brief and use the email address you provided to discuss your goals, requirements and possible next steps.'],
];

function Intro({ label, title, emphasis, children }) {
  return (
    <section className="page-intro">
      <div className="wrap">
        <p className="eyebrow">{label}</p>
        <h1>{title} {emphasis && <em>{emphasis}</em>}</h1>
        {children && <p className="lede">{children}</p>}
      </div>
    </section>
  );
}

function CallToAction() {
  return (
    <section className="section cta-section" id="contact">
      <div className="wrap cta-panel">
        <div><h2>Have a project in mind?</h2><p>Share your goals and let’s discuss what it would take to get there.</p></div>
        <a className="btn btn-dark" href="/contact#lead-form">Request a free consultation</a>
      </div>
    </section>
  );
}

function Process() {
  return (
    <section className="section process-section" aria-labelledby="process-title">
      <div className="wrap">
        <p className="eyebrow">How we work</p>
        <h2 id="process-title">From brief to launch.</h2>
        <ol className="process-list">
          {approach.map(([title, copy]) => <li key={title}><h3>{title}</h3><p>{copy}</p></li>)}
        </ol>
      </div>
    </section>
  );
}

function ClientVoices({ clients, settings }) {
  const companies = [...new Set(settings.clientLogos.split(',').map(name => name.trim()).filter(Boolean))];
  if (!clients.length && !companies.length) return null;

  return (
    <section className="section" id="testimonials" aria-labelledby="testimonials-title">
      <div className="wrap">
        <h2 id="testimonials-title">{settings.clientsHeading} <em>{settings.clientsEmphasis}</em> {settings.clientsHeadingEnd}</h2>
        {clients.length > 0 && <div className="quote-grid">
          {clients.map(client => <figure key={client._id} className="quote-card">
            <blockquote>“{client.quote}”</blockquote>
            <figcaption>
              {client.image && <img src={client.image} alt="" width="44" height="44" loading="lazy" />}
              <div>
                <strong>{client.name}</strong>
                <span>{[client.role, client.company].filter(Boolean).join(', ')}</span>
                {client.rating > 0 && <span>{client.rating} out of 5</span>}
              </div>
            </figcaption>
          </figure>)}
        </div>}
        {companies.length > 0 && <ul className="company-list" aria-label="Client companies">
          {companies.map(company => <li key={company}>{company}</li>)}
        </ul>}
      </div>
    </section>
  );
}

export function HomePage({ settings, services, works, clients, about }) {
  return (
    <>
      <div className="wrap hero-wrap">
        <section className="hero" id="top" aria-labelledby="hero-title" data-testid="hero-section">
          {settings.heroImage && <img className="hero-image" src={settings.heroImage} alt="" width="1536" height="1024" fetchPriority="high" />}
          <div className="hero-content">
            {settings.heroStatus && <p className="hero-status" data-testid="hero-status"><span aria-hidden="true" />{settings.heroStatus}</p>}
            <h1 id="hero-title" data-testid="hero-title">
              <span>{settings.heroLine1}</span>{' '}<span>{settings.heroLine2} <em>{settings.heroLine3}</em></span>
            </h1>
            <p className="hero-copy" data-testid="hero-subtitle">{settings.heroIntro}</p>
            <div className="actions">
              <a className="btn btn-primary" href="/contact#lead-form" data-testid="hero-cta-consultation">Get a free consultation</a>
              <a className="btn btn-outline" href="/work" data-testid="hero-cta-work">Explore our work</a>
            </div>
          </div>
        </section>
        {services.length > 0 && <nav className="capabilities" aria-label="Explore our capabilities">
          {services.slice(0, 4).map(service => <a key={service._id} href={'/services#service-' + service._id}>{service.name}</a>)}
        </nav>}
      </div>
      <Services services={services.slice(0, 3)} settings={settings} preview />
      {works.length > 0 && <Portfolio works={works.slice(0, 2)} settings={settings} preview />}
      <section className="section company-preview" aria-labelledby="about-title" id="about">
        <div className="wrap company-preview-grid">
          <div><p className="eyebrow">Company</p><h2 id="about-title">{about.heading} <em>{about.emphasis}</em></h2></div>
          <div><p>{about.first}</p><a className="btn btn-secondary" href="/about">Read the company profile</a></div>
        </div>
      </section>
      <ClientVoices clients={clients} settings={settings} />
      <CallToAction />
    </>
  );
}

export function ServicesPage({ settings, services }) {
  return (
    <>
      <Intro label="Services" title={settings.servicesHeading} emphasis={settings.servicesEmphasis}>{settings.servicesIntro}</Intro>
      <Services services={services} settings={settings} />
      <Process />
      <CallToAction />
    </>
  );
}

export function WorkPage({ settings, works, clients }) {
  return (
    <>
      <Intro label="Portfolio" title={settings.worksHeading} emphasis={settings.worksEmphasis}>
        Explore {works.some(work => work.isExample) ? 'illustrative projects and the kinds of products we can build.' : 'projects across web, mobile, design, search and cloud.'}
      </Intro>
      <Portfolio works={works} settings={settings} />
      <ClientVoices clients={clients} settings={settings} />
      <CallToAction />
    </>
  );
}

export function CompanyPage({ settings, about, services }) {
  return (
    <div className="company-page">
      <Intro label="Company profile" title={about.heading} emphasis={about.emphasis}>{about.mission}</Intro>
      <section className="section profile-overview" aria-labelledby="company-overview">
        <div className="wrap profile-grid">
          <div>
            <h2 id="company-overview">What we do</h2>
            <p>{about.first}</p>
            <p>{about.second}</p>
            <div className="actions profile-actions">
              <a className="btn btn-dark" href="/contact#lead-form">Work with us</a>
              <button className="btn btn-secondary" type="button" onClick={() => window.print()}>Print company profile</button>
            </div>
          </div>
          <div className="profile-aside">
            <h3>{settings.name}</h3>
            {services.length > 0 && <ul>{services.map(service => <li key={service._id}><a href={'/services#service-' + service._id}>{service.name}</a></li>)}</ul>}
            {settings.email && <p><a href={'mailto:' + settings.email}>{settings.email}</a></p>}
            {settings.phone && <p><a href={'tel:' + settings.phone}>{settings.phone}</a></p>}
            {settings.address && <p>{settings.address}</p>}
          </div>
        </div>
        {about.profileStats.length > 0 && <dl className="wrap profile-stats">
          {about.profileStats.map(stat => <div key={stat.index}><dt>{stat.label}</dt><dd>{stat.value}</dd></div>)}
        </dl>}
        {(about.teamImage || about.officeImage) && <div className="wrap profile-photos">
          {[about.teamImage, about.officeImage].filter(Boolean).map((src, index) => <img key={index} src={src} alt="" loading="lazy" width="640" height="360" />)}
        </div>}
      </section>
      <section className="section engagement-section" aria-labelledby="engagement-title">
        <div className="wrap">
          <h2 id="engagement-title">Who we work with</h2>
          <div className="engagement-grid">
            {engagements.map(([title, copy]) => <article key={title}><h3>{title}</h3><p>{copy}</p></article>)}
          </div>
        </div>
      </section>
      <Process />
      <CallToAction />
    </div>
  );
}

export function ContactPage({ settings, services }) {
  return (
    <>
      <Contact settings={settings} services={services} preferredService={new URLSearchParams(window.location.search).get('service')} />
      <section className="section faq-section" aria-labelledby="faq-title">
        <div className="wrap faq-grid">
          <div><p className="eyebrow">Before you start</p><h2 id="faq-title">Common questions</h2></div>
          <div>
            {faqs.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}
          </div>
        </div>
      </section>
    </>
  );
}

export function PrivacyPage({ settings }) {
  return (
    <>
      <Intro label={settings.name} title="Privacy notice">How we handle the information you share when you enquire about a project.</Intro>
      <div className="wrap legal section">
        <section>
          <h2>Information you submit</h2>
          <p>The consultation form collects your name, email address, selected service, optional budget and project details. Please leave out passwords, payment details and other sensitive information.</p>
        </section>
        <section>
          <h2>How we use it</h2>
          <p>We use enquiry information to review your brief, respond to you and manage any follow-up about the project. Enquiries are stored in our database and made available to authorised users through the administration dashboard.</p>
        </section>
        <section>
          <h2>Website and storage providers</h2>
          <p>Our hosting and database providers process information to operate the website and store enquiries. When you visit the site, the host receives the request data needed to serve pages and handle forms.</p>
        </section>
        <section>
          <h2>Questions and requests</h2>
          <p>To ask about your enquiry data, request a correction or ask for deletion, {settings.email
            ? <a href={'mailto:' + settings.email}>email {settings.email}</a>
            : <a href="/contact#lead-form">use the contact form</a>}. Include the email address you originally used so we can identify the enquiry.</p>
        </section>
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <>
      <Intro label="404" title="Page not found.">The page may have moved or the address may be incorrect.</Intro>
      <div className="wrap section"><a className="btn btn-dark" href="/">Back to home</a></div>
    </>
  );
}
