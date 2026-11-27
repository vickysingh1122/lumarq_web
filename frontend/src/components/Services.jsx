const detailById = {
  '100000000000000000000001': ['Marketing sites', 'Web applications', 'E-commerce'],
  '100000000000000000000002': ['iOS and Android', 'Prototyping', 'App integrations'],
  '100000000000000000000003': ['Technical SEO', 'Site migrations', 'Content structure'],
  '100000000000000000000004': ['Cloud infrastructure', 'Deployments', 'Monitoring'],
  '100000000000000000000005': ['Product flows', 'Prototypes', 'Design systems'],
  '100000000000000000000006': ['Updates', 'Backups', 'Maintenance'],
};

export default function Services({ services, settings, preview = false }) {
  return (
    <section className={preview ? 'section services-section' : 'section services-section inner-listing'} id="services" aria-label="Services" data-testid="services-section">
      <div className="wrap">
        {preview && <div className="section-head">
          <div><p className="eyebrow">What we do</p><h2>{settings.servicesHeading} <em>{settings.servicesEmphasis}</em></h2></div>
          <a className="btn btn-secondary" href="/services">View all services</a>
        </div>}
        {services.length ? <div className="service-grid">
          {services.map((service, index) => {
            const tags = service.tags ? service.tags.split(',').map(tag => tag.trim()).filter(Boolean) : detailById[service._id];
            const destination = preview
              ? '/services#service-' + service._id
              : '/contact' + (service.formLabel ? '?service=' + encodeURIComponent(service._id) : '') + '#lead-form';

            return (
              <article key={service._id} className="service-card" id={'service-' + service._id}>
                {service.image
                  ? <img className="service-image" src={service.image} alt={service.alt || ''} width="480" height="240" loading="lazy" />
                  : <div className={'service-art style-' + (index % 3)} aria-hidden="true"><i /><i /><i /></div>}
                <div className="service-copy">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  {service.metric && <p className="metric"><strong>{service.metric}</strong> {service.metricLabel}</p>}
                  {tags?.length > 0 && <ul className="tags">{tags.map((tag, position) => <li key={position}>{tag}</li>)}</ul>}
                  <a className="text-link" href={destination} aria-label={(preview ? 'Explore ' : 'Discuss ') + service.name}>
                    {preview ? 'Explore service' : 'Discuss this service'}
                  </a>
                </div>
              </article>
            );
          })}
        </div> : <p>Tell us about the support you’re looking for and we can discuss what fits your project.</p>}
      </div>
    </section>
  );
}
