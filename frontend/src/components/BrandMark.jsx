export default function BrandMark({ settings }) {
  return <>
    {settings.logo ? <img src={settings.logo} alt="" width="32" height="32" /> : <svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#0D1322" stroke="rgba(255,255,255,.12)"/><path d="M10 7v18h12" stroke="#00E5FF" strokeWidth="3.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M15 18a7 7 0 0 1 7-7" stroke="#2DD4BF" strokeWidth="3.2" fill="none" strokeLinecap="round"/><circle cx="22" cy="18" r="2.3" fill="#FFB800"/></svg>}
    {settings.name === "Lumarq Digital" ? <span>Lumarq<small>digital</small></span> : <span>{settings.name}</span>}
  </>;
}