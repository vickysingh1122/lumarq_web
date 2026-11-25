import { useEffect, useRef, useState } from 'react';
import { categories, statuses } from '../contentCatalog.js';
import { adminRequest, uploadImage } from './api.js';

const inputTypes = { email: 'email', phone: 'tel', order: 'number', count: 'number', rating: 'number' };
const numeric = Object.keys(inputTypes).filter(key => inputTypes[key] === 'number');
const types = 'image/jpeg,image/png,image/webp';

function ImageField({ name, value, onChange, file, onFile }) {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="admin-image-field">
      <input id={'field-' + name} type="text" value={value}
        onChange={event => { onFile(null); onChange(event.target.value); }} placeholder="https://… or upload a file" />
      <label className="admin-file">Choose JPEG, PNG or WebP up to 2 MB
        <input type="file" accept={types} onChange={event => onFile(event.target.files[0] || null)} />
      </label>
      {file && <span>{file.name}</span>}
      {(file ? preview : value) && <img src={file ? preview : value} alt="" className="admin-image-preview" />}
    </div>
  );
}

function initialValues(fields, record) {
  return Object.fromEntries(fields.map(([name, , type]) => [
    name, record?.[name] ?? ({ order: 100, rating: 5, count: 0 }[type] ?? ''),
  ]));
}

export function ContentForm({ resource, config, record, onSaved, onExpired }) {
  const [values, setValues] = useState(() => initialValues(config.fields, record));
  const [files, setFiles] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const change = (key, value) => setValues(previous => ({ ...previous, [key]: value }));

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const body = { ...values };
      for (const [name, , type] of config.fields) {
        if (numeric.includes(type)) body[name] = Number(body[name]);
        const file = files[name];
        if (!file) continue;
        if (file.size > 2 * 1024 * 1024 || !types.split(',').includes(file.type)) {
          throw new Error('Choose a JPEG, PNG or WebP file up to 2 MB.');
        }
        body[name] = await uploadImage(file);
        setValues(previous => ({ ...previous, [name]: body[name] }));
        setFiles(previous => ({ ...previous, [name]: null }));
      }
      await adminRequest(resource, {
        method: config.single || record?._id ? 'PUT' : 'POST', id: record?._id, body,
      });
      onSaved();
    } catch (failure) {
      if (failure.status === 401) onExpired();
      else setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={save}>
      <fieldset disabled={saving} className="admin-fields">
        {config.fields.map(([name, label, type]) => {
          const props = { id: 'field-' + name, value: values[name], onChange: event => change(name, event.target.value) };
          return (
            <div className={'admin-field' + (type === 'textarea' || type === 'image' ? ' full' : '')} key={name}>
              <label htmlFor={props.id}>{label}</label>
              {type === 'image' ? <ImageField name={name} value={values[name]} onChange={value => change(name, value)}
                file={files[name]} onFile={file => setFiles(previous => ({ ...previous, [name]: file }))} />
                : type === 'textarea' ? <textarea {...props} rows={3} maxLength={6000} />
                : <input {...props} type={inputTypes[type] || 'text'}
                    list={type === 'category' ? 'work-categories' : undefined}
                    required={type === 'required' || type === 'category' || numeric.includes(type)}
                    min={numeric.includes(type) ? 0 : undefined}
                    max={type === 'rating' ? 5 : type === 'order' ? 10000 : type === 'count' ? 1e9 : undefined}
                    step={type === 'rating' ? 0.5 : type === 'count' ? 0.01 : undefined}
                  />}
            </div>
          );
        })}
        <datalist id="work-categories">{categories.map(category => <option key={category} value={category} />)}</datalist>
      </fieldset>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-form-actions"><button className="admin-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></div>
    </form>
  );
}

export function ConsultationForm({ record, onSaved, onExpired }) {
  const [status, setStatus] = useState(record.status);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminRequest('consultations', { method: 'PUT', id: record._id, body: { status } });
      onSaved();
    } catch (failure) {
      if (failure.status === 401) onExpired();
      else setError(failure.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <dl className="admin-lead">
        <div><dt>Email</dt><dd><a href={'mailto:' + record.email}>{record.email}</a></dd></div>
        <div><dt>Service</dt><dd>{record.service}</dd></div>
        <div><dt>Budget</dt><dd>{record.budget || '—'}</dd></div>
        <div className="full"><dt>Project details</dt><dd className="admin-message">{record.message}</dd></div>
      </dl>
      <div className="admin-field"><label htmlFor="request-status">Status</label>
        <select id="request-status" value={status} onChange={event => setStatus(event.target.value)} disabled={saving}>
          {statuses.map(option => <option key={option}>{option}</option>)}
        </select>
      </div>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-form-actions"><button className="admin-primary" disabled={saving}>{saving ? 'Saving…' : 'Save status'}</button></div>
    </form>
  );
}

export function EditorDialog({ title, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => ref.current.showModal(), []);
  return (
    <dialog ref={ref} className="admin-dialog" onClose={onClose} aria-labelledby="editor-title">
      <div className="admin-dialog-heading"><h2 id="editor-title">{title}</h2>
        <button type="button" className="admin-secondary" onClick={() => ref.current.close()}>Close</button></div>
      {children}
    </dialog>
  );
}
