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
      <div className="admin-section-title"><h1>{config.title}</h1>
        {!isLead && <button className="admin-primary" onClick={() => setEdit({})}>+ Add {config.singular}</button>}
      </div>
      <section className="admin-card">
        <div className="admin-toolbar">
          <label>Search<input type="search" value={search} maxLength={100}
            onChange={event => setSearch(event.target.value)} placeholder="Search records" /></label>
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
        <div className="admin-table-scroll" tabIndex={0} aria-label={config.title + ' data table'}>
          <table>
            <thead><tr>
              {!isLead && <th scope="col">Image</th>}
              {columns[resource].map(([key, title]) => <th scope="col" key={key}>{title}</th>)}
              <th scope="col">Actions</th>
            </tr></thead>
            <tbody>
              {!result?.rows.length && <tr><td colSpan={columns[resource].length + (isLead ? 1 : 2)}>
                {result ? 'No matching records.' : error ? 'Records unavailable.' : 'Loading records…'}
              </td></tr>}
              {result?.rows.map(row => (
                <tr key={row._id}>
                  {!isLead && <td>{row.image ? <img className="admin-thumb" src={row.image} alt="" loading="lazy" /> : '—'}</td>}
                  {columns[resource].map(([field]) => <td key={field} className={field === 'description' ? 'admin-cell-description' : ''}>
                    {displayValue(field, row[field])}
                  </td>)}
                  <td><div className="admin-row-actions">
                    <button className="admin-secondary" onClick={() => setEdit(row)}>{isLead ? 'Open' : 'Edit'}</button>
                    <button className="admin-danger" disabled={Boolean(deleting)} onClick={() => remove(row)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-pagination">
          <span>{result?.total ?? 0} {(result?.total ?? 0) === 1 ? 'record' : 'records'}</span>
          <div><button className="admin-secondary" aria-label="Previous page" disabled={visiblePage <= 1}
            onClick={() => setPage(visiblePage - 1)}>Previous</button>
            <span>Page {visiblePage} of {pages}</span>
            <button className="admin-secondary" aria-label="Next page" disabled={visiblePage >= pages}
              onClick={() => setPage(visiblePage + 1)}>Next</button></div>
        </div>
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
      <h1 className="admin-section-title">{config.title}</h1>
      <section className="admin-card">
        {error && <p role="alert" className="admin-error admin-table-notice">{error}</p>}
        {saved && <p role="status" className="admin-feedback admin-table-notice">Changes saved.</p>}
        {data && <ContentForm resource={resource} config={config} record={data}
          onSaved={() => setSaved(true)} onExpired={onExpired} />}
      </section>
    </>
  );
}
