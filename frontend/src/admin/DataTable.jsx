import { useEffect, useState } from 'react';
import { modules } from '../contentCatalog.js';
import initial from '../initialContent.json';
import { adminRequest } from './api.js';
import { ConsultationForm, ContentForm, EditorDialog } from './Editor.jsx';

const columns = {
  services: [['name', 'Name'], ['description', 'Description'], ['order', 'Order']],
  works: [['name', 'Name'], ['category', 'Category'], ['kpi', 'Result'], ['order', 'Order']],
  clients: [['name', 'Name'], ['role', 'Title'], ['company', 'Company'], ['rating', 'Rating']],
  consultations: [['name', 'Name'], ['email', 'Email'], ['service', 'Service'], ['status', 'Status'], ['createdAt', 'Received']],
};
const descriptions = {
  consultations: 'Review incoming project enquiries and track their status.',
  services: 'Manage the services shown on the website and enquiry form.',
  works: 'Manage the projects shown in the website portfolio.',
  clients: 'Manage client testimonials for the public website.',
  about: 'Edit the company profile, photos and published figures.',
  settings: 'Manage the website branding, contact details and page copy.',
};

function displayValue(field, value) {
  if (field === 'createdAt' && value) return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
  if (field === 'status') return <span className="admin-status" data-status={value}>{value}</span>;
  return value === '' || value == null ? '—' : value;
}

export function DataTable({ resource, onExpired }) {
  const config = modules[resource];
  const isLead = resource === 'consultations';
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('');
  const [size, setSize] = useState(10);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [revision, setRevision] = useState(0);
  const [edit, setEdit] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { setTerm(search.trim()); setPage(1); }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const controller = new AbortController();
    setError('');
    adminRequest(resource, { query: { search: term, filter, sort, page, size }, signal: controller.signal })
      .then(setResult)
      .catch(failure => {
        if (failure.name === 'AbortError') return;
        if (failure.status === 401) onExpired();
        else setError(failure.message);
      });
    return () => controller.abort();
  }, [resource, term, filter, sort, page, size, revision, onExpired]);

  const refresh = message => {
    setEdit(null);
    setFeedback(message);
    setRevision(value => value + 1);
  };

  async function remove(row) {
    if (!window.confirm('Permanently delete ' + row.name + '?')) return;
    setDeleting(row._id);
    setError('');
    try {
      await adminRequest(resource, { method: 'DELETE', id: row._id });
      refresh('Record deleted.');
    } catch (failure) {
      if (failure.status === 401) onExpired();
      else setError(failure.message);
    } finally {
      setDeleting(null);
    }
  }

  const visiblePage = result?.page ?? page;
  const pages = Math.max(1, Math.ceil((result?.total ?? 0) / size));

  return (
    <>
      <div className="admin-section-title"><div><h1 id="module-title">{config.title}</h1><p>{descriptions[resource]}</p></div>
        {!isLead && <button className="admin-primary" onClick={() => setEdit({})}>+ Add {config.singular}</button>}
      </div>
      <section className="admin-card admin-records" aria-labelledby="module-title">
        <div className="admin-records-heading">
          <h2>{isLead ? 'Enquiry inbox' : config.title + ' list'}</h2>
          {result && <span className="admin-count">{result.total} {result.total === 1 ? 'record' : 'records'}</span>}
        </div>
        <div className="admin-toolbar">
          <label>Search<input type="search" value={search} maxLength={100}
            onChange={event => setSearch(event.target.value)} placeholder={isLead ? 'Name, email, service or message' : 'Search records'} /></label>
          {config.filter && <label>{config.filterLabel}
            <select value={filter} onChange={event => { setFilter(event.target.value); setPage(1); }}>
              <option value="">All</option>
              {(result?.options ?? config.options).map(option => <option key={option}>{option}</option>)}
            </select></label>}
          <label>Sort by<select value={sort} onChange={event => { setSort(event.target.value); setPage(1); }}>
            <option value="">{isLead ? 'Newest' : 'Display order'}</option>
            <option value="name">Name</option>
            {!isLead && <option value="recent">Newest</option>}
          </select></label>
          <label>Per page<select value={size} onChange={event => { setSize(Number(event.target.value)); setPage(1); }}>
            {[10, 25, 50].map(option => <option key={option}>{option}</option>)}
          </select></label>
        </div>
        {error && <p className="admin-error admin-table-notice" role="alert">{error}</p>}
        {feedback && <p className="admin-feedback admin-table-notice" role="status">{feedback}</p>}
        <div className="admin-table-scroll">
          <table role="table" aria-label={config.title + ' records'}>
            <thead role="rowgroup"><tr role="row">
              {!isLead && <th scope="col" role="columnheader">Image</th>}
              {columns[resource].map(([key, title]) => <th scope="col" role="columnheader" key={key}>{title}</th>)}
              <th scope="col" role="columnheader">Actions</th>
            </tr></thead>
            <tbody role="rowgroup">
              {!result?.rows.length && <tr role="row" className="admin-empty"><td role="cell" colSpan={columns[resource].length + (isLead ? 1 : 2)}>
                {result ? 'No matching records.' : error ? 'Records unavailable.' : 'Loading records…'}
              </td></tr>}
              {result?.rows.map(row => (
                <tr key={row._id} role="row">
                  {!isLead && <td role="cell" className="admin-cell-image"><span className="admin-cell-label" aria-hidden="true">Image</span>
                    {row.image ? <img className="admin-thumb" src={row.image} alt="" loading="lazy" /> : '—'}
                  </td>}
                  {columns[resource].map(([field, title]) => <td role="cell" key={field} className={'admin-cell-' + field}>
                    <span className="admin-cell-label" aria-hidden="true">{title}</span>
                    <span>{displayValue(field, row[field])}</span>
                  </td>)}
                  <td role="cell" className="admin-cell-actions"><div className="admin-row-actions">
                    <button className="admin-secondary" aria-label={(isLead ? 'Open ' : 'Edit ') + row.name} onClick={() => setEdit(row)}>{isLead ? 'Open' : 'Edit'}</button>
                    <button className="admin-danger" aria-label={'Delete ' + row.name} disabled={Boolean(deleting)} onClick={() => remove(row)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <nav className="admin-pagination" aria-label="Record pages">
          <div><button className="admin-secondary" aria-label="Previous page" disabled={visiblePage <= 1}
            onClick={() => setPage(visiblePage - 1)}>Previous</button>
            <span>Page {visiblePage} of {pages}</span>
            <button className="admin-secondary" aria-label="Next page" disabled={visiblePage >= pages}
              onClick={() => setPage(visiblePage + 1)}>Next</button></div>
        </nav>
      </section>
      {edit && <EditorDialog title={edit.name || 'Add ' + config.singular} onClose={() => setEdit(null)}>
        {isLead ? <ConsultationForm record={edit} onSaved={() => refresh('Status saved.')} onExpired={onExpired} />
          : <ContentForm resource={resource} config={config} record={edit}
              onSaved={() => refresh('Changes saved.')} onExpired={onExpired} />}
      </EditorDialog>}
    </>
  );
}

export function SingleContent({ resource, onExpired }) {
  const config = modules[resource];
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    adminRequest(resource, { signal: controller.signal }).then(current => setData({ ...initial[resource], ...current }))
      .catch(failure => {
        if (failure.name === 'AbortError') return;
        if (failure.status === 401) onExpired();
        else setError(failure.message);
      });
    return () => controller.abort();
  }, [resource, onExpired]);

  return (
    <>
      <div className="admin-section-title"><div><h1 id="module-title">{config.title}</h1><p>{descriptions[resource]}</p></div></div>
      <section className="admin-card admin-editor-card" aria-labelledby="module-title">
        {error && <p role="alert" className="admin-error admin-table-notice">{error}</p>}
        {saved && <p role="status" className="admin-feedback admin-table-notice">Changes saved.</p>}
        {!data && !error && <p className="admin-table-notice" role="status">Loading content…</p>}
        {data && <ContentForm resource={resource} config={config} record={data}
          onSaved={() => setSaved(true)} onExpired={onExpired} />}
      </section>
    </>
  );
}
