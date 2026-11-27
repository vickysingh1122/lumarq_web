import { useState } from 'react';

export default function Portfolio({ works, settings, preview = false }) {
  const [filter, setFilter] = useState('');
  const filters = [...new Set(works.map(work => work.category))];
  const visible = filter && filters.includes(filter) ? works.filter(work => work.category === filter) : works;

  return (
    <section className={preview ? 'section work-section' : 'section work-section inner-listing'} id="work" aria-label="Project portfolio" data-testid="portfolio-section">
      <div className="wrap">
        {preview && <div className="section-head">
          <div><p className="eyebrow">Portfolio</p><h2>{settings.worksHeading} <em>{settings.worksEmphasis}</em></h2></div>
          <a className="btn btn-secondary" href="/work">View portfolio</a>
        </div>}
        {!preview && filters.length > 1 && <div className="filters" role="group" aria-label="Filter projects">
          {['', ...filters].map(category => <button key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)}>{category || 'All projects'}</button>)}
        </div>}
        <div className="work-grid" aria-live="polite">
          {visible.map(work => <article key={work._id} className="work-card">
            {work.image && <img src={work.image} alt={work.alt || ''} width="640" height="360" loading="lazy" />}
            <div className="work-copy">
              <p className="work-category">{work.category}{work.isExample && ' · Illustrative project'}</p>
              <h3>{work.name}</h3>
              <p>{work.description}</p>
              {work.kpi && <p className="metric"><strong>{work.kpi}</strong></p>}
              {!preview && <a className="text-link" href="/contact#lead-form" aria-label={'Discuss a project like ' + work.name}>Discuss a similar project</a>}
            </div>
          </article>)}
          {!visible.length && <p>Projects will appear here as they are published.</p>}
        </div>
      </div>
    </section>
  );
}
