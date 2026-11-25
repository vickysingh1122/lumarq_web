export default function About({ about }) {
  return (
    <section className="sec about" id="about" aria-labelledby="about-title" data-testid="about-section">
      <div className="wrap">
        <div className="about-grid">
          <div className="about-media" data-reveal="">
            <div className="badge-rot" aria-hidden="true">
              <svg viewBox="0 0 120 120"><defs><path id="circ" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs><circle cx="60" cy="60" r="58" fill="#0B1224"/><text fontFamily="JetBrains Mono" fontSize="10.5" letterSpacing="3" fill="#EEF2F6"><textPath href="#circ">SENIOR TEAM • SHIPPED WORK • </textPath></text></svg>
              <b style={{"color":"#00E5FF"}}>✦</b>
            </div>
            <div className="ph"><img className="parallax-slow" src={about.teamImage || undefined} alt="Lumarq engineers reviewing a build together around a laptop" loading="lazy" width="1100" height="733" /></div>
            <div className="ph2"><img src={about.officeImage || undefined} alt="The Lumarq studio workspace" loading="lazy" width="1100" height="733" /></div>
          </div>
          <div className="story">
            <div data-reveal="">
              <span className="eyebrow">02 — About Lumarq</span>
              <h2 className="h2" id="about-title">{about.heading}<br/><em>{about.emphasis}</em></h2>
            </div>
            <p data-reveal="" data-delay=".05">{about.first}</p>
            <p data-reveal="" data-delay=".1">{about.second}</p>
            <p className="mission" data-reveal="" data-delay=".15">{about.mission}</p>
            <ul className="pillars">
              <li data-reveal=""><b>Weekly demos</b><span>See working software every Friday.</span></li>
              <li data-reveal="" data-delay=".06"><b>You own the code</b><span>Repos, docs and infra in your name.</span></li>
              <li data-reveal="" data-delay=".12"><b>Security-first</b><span>Reviews and audits on every release.</span></li>
              <li data-reveal="" data-delay=".18"><b>Fixed-scope sprints</b><span>Clear price before work begins.</span></li>
            </ul>
          </div>
        </div>
        <div className="stats" data-testid="about-stats">
          {Array.from({ length: 4 }, (_, index) => {
            const count = about["count" + index];
            const suffix = about["suffix" + index];
            const precision = String(count).split(".")[1]?.length || 0;
            return <div key={index} data-reveal="" data-delay={index * .06 || undefined}>
              <b data-count={count} data-dec={precision} data-suffix={suffix}>{count}{suffix}</b><span>{about["label" + index]}</span>
            </div>;
          })}
        </div>
      </div>
    </section>
  );
}
