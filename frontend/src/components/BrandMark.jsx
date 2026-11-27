export default function BrandMark({ settings }) {
  return <>
    {settings.logo
      ? <img src={settings.logo} alt="" width="34" height="34" />
      : <span className="brand-icon" aria-hidden="true"><i /><i /><i /></span>}
    <span>{settings.name}</span>
  </>;
}
