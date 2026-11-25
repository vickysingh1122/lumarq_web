import initial from '../initialContent.json';
import { categories } from '../contentCatalog.js';

export default function Portfolio({ works, settings }) {
  const filters = [...new Set([...categories, ...works.map(work => work.category)])];
  return (
    <section className="sec" id="work" aria-labelledby="work-title" data-testid="portfolio-section">
      <div className="wrap">
        <div className="sec-head">
          <div data-reveal="">
            <span className="eyebrow">03 — Selected work</span>
            <h2 className="h2" id="work-title">{settings.worksHeading} <em>{settings.worksEmphasis}</em></h2>
          </div>
          <div className="filters" role="group" aria-label="Filter projects" data-reveal="" data-delay=".1">
            <button type="button" aria-pressed="true" data-all="" data-filter="all" data-testid="filter-all">All</button>
            {filters.map(category => <button key={category} type="button" aria-pressed="false" data-filter={category.toLowerCase()}
              data-testid={"filter-" + category.toLowerCase()}>{category}</button>)}
          </div>
        </div>
        <div className="works" id="works" aria-live="polite">
          {works.map((work, index) => {
            const template = initial.works.find(item => item._id === work._id);
            return <article key={work._id} className="work" data-cat={work.category.toLowerCase()} data-reveal="" data-delay={(index % 4) * .06 || undefined}
              data-testid={"project-" + (template?.slug || work._id)}>
              <a href="#contact" aria-label={"Discuss a project like " + work.name}>
                <div className="shot">
                  {work.kpi && <span className="kpi">{work.kpi}</span>}
                  {work.image && <img src={work.image} alt={work.alt} loading="lazy" width="1100" height="733" />}
                  <span className="open" aria-hidden="true">{"\u2197"}</span>
                </div>
              </a>
              <h3>{work.name} <small>{work.category}</small></h3><p>{work.description}</p>
            </article>;
          })}
        </div>
      </div>
    </section>
  );
}
