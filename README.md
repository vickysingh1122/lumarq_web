# Lumarq Digital

The original static site is available in `index.html`, `css/`, `js/`, and `img/`. The React application is in `frontend/`. Express serves the consultation API from `backend/` and MongoDB Atlas stores consultations.

## Run locally

Use Node.js 24. From the repository root:

```powershell
npm ci
npm --prefix frontend ci
Copy-Item .env.example .env
```

Set `MONGODB_URI` in the root `.env` to the Atlas Node.js connection string. Set `MONGODB_DB` if using a database other than `lumarq`. Configure Atlas networking and grant the application database user read/write access to the target database.

Run the API and frontend in separate terminals:

```powershell
npm run dev
npm --prefix frontend run dev
```

Run `npm test` for the API contract checks and `npm run build` for the production build.

## Deploy to Vercel

Import this repository as one Vercel project using the repository root. The tracked configuration builds Vite into `frontend/dist` and deploys `api/` as Node.js functions. Set `MONGODB_URI` and `MONGODB_DB` in the Vercel project's environment variables and configure connectivity from Vercel to Atlas. Create a deployment after setting the environment variables.

Open `/api/health` on the deployment domain, then submit the consultation form and confirm a document appears in the `consultations` collection.

## Migration checklist

| Feature | Status |
| --- | --- |
| Header, hero, marquee, services, about, portfolio, testimonials, contact and footer | Migrated into React components. Compared layouts and section screenshots against the static site in Edge. |
| Mobile navigation, portfolio filters, testimonial arrows and dots, scroll-to-top and reveal effects | Migrated using the original behavior. Exercised in Edge. |
| Consultation validation, request, success and reset | Migrated to React state. Tested in Edge with an Express test storage adapter. |
| Express validation and storage error responses | Tested with `npm test`. |
| Narrow contact form | Adjusted the contact grid and button wrapping to correct overflow at 320px. |
| Vercel deployment and live Atlas writes | Require an authenticated Vercel account and an Atlas connection. |

The React build uses the original Lenis and Motion versions. The original preview editor, error overlay, and session recorder are specific to the old hosting preview and stay in the static source.

## Source dependencies

The source references `avatar-1.jpg`, `avatar-2.jpg`, and `avatar-4.jpg`, which are missing from the supplied image directory. The original email, telephone, address, canonical domain, social destinations, and legal links are placeholders.

## Admin dashboard

Open `/admin` on the frontend domain. The sidebar contains Consultations, Services, About, Works, Clients, and Settings. Services, Works, and Clients have searchable data tables with server-side pagination and add, edit, and delete actions. Consultations are created by the public form. Admins can read them, filter by status, update status, and delete records. About and Settings are single-record editors.

### Initialise the database and account

1. Set `MONGODB_URI`, `MONGODB_DB`, and `ADMIN_JWT_SECRET` in the local root `.env`. Generate a random JWT secret with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Use a different secret for each environment.
2. Add `ADMIN_BOOTSTRAP_EMAIL` and `ADMIN_BOOTSTRAP_PASSWORD` to your local `.env`. Use a password of at least 14 characters. Run `npm.cmd run db:setup -- --reset-admin`. This copies the current site into MongoDB on first setup, creates indexes, and creates or resets the named account. Existing consultation records are preserved. Subsequent runs leave published edits and deletions in place.
3. Remove the bootstrap password and email from `.env` after setup. Use the same setup command later with temporary bootstrap values to rotate the password and revoke that account's sessions.
4. Start the API and frontend as above. Sign in at the Vite URL followed by `/admin`. For Vercel, set the database settings and `ADMIN_JWT_SECRET` in the project environment. Run the setup command against the matching database from an authorised machine. Set `ADMIN_ORIGIN` only if a proxy requires overriding the exact origin inferred from the request host. Local and preview environments should use separate databases from production.

Edits publish to the public site on its next load. Use an HTTPS image URL or upload a JPEG, PNG, or WebP file of up to 2 MB. For a service to appear in the consultation form, set its consultation option label. Public forms record the service name at the time of submission.

Admin sessions use one-hour signed JWTs in HttpOnly, SameSite=Strict cookies, with Secure cookies on deployed HTTPS. A server-side session record supports revocation on sign-out and password reset. Passwords use salted scrypt hashes. Mutations require a same-origin JSON request and sign-in attempts are rate limited.

### MongoDB schema

The [content catalog](frontend/src/contentCatalog.js) defines editable fields. The [API schemas](backend/content.js) enforce types and limits. The [setup script](backend/setup.js) creates the indexes. All timestamps are BSON dates.

| Collection | Fields and relationships | Indexes beyond the default `_id` index |
| --- | --- | --- |
| `services` | String ID, name, description, image URL, alt text, comma-separated tags, metric, metric label, consultation option label, numeric display order, created/updated timestamps | Display order and name, with ID tiebreakers |
| `works` | String ID, name, category, description, image URL, alt text, result, numeric display order, created/updated timestamps | Display order, name, and category plus display order |
| `clients` | String ID, name, role, company, testimonial, rating from 0 to 5, image URL, numeric display order, created/updated timestamps | Display order and name |
| `about` | Singleton ID `site`, heading and emphasis, first and second paragraphs, mission, team and office image URLs, four numeric counters with suffixes and labels, created/updated timestamps | — |
| `settings` | Singleton ID `site`, business name, logo URL, email, phone, address, hours, featured company names, headings and copy for hero, services, works, clients and contact, hero image URL, created/updated timestamps | — |
| `consultations` | ObjectId, name, email, service, optional budget, message, status, created timestamp and optional updated timestamp. Historical requests without a status are treated as New. | Created date and status plus created date |
| `media` | SHA-256 string ID, MIME type, BSON binary image and created timestamp. Content records refer to media via an image URL. | — |
| `admin_users` | String ID, normalised email, salted password hash, credential version, active flag and created/updated timestamps | Unique email |
| `admin_sessions` | Random token ID, admin ID, credential version and expiry timestamp | Admin ID and TTL expiry |
| `admin_login_limits` | HMAC-derived IP and time-bucket ID, attempt count and expiry timestamp | TTL expiry |
| `content_meta` | Singleton ID `site`, schema version and created timestamp | — |

Run `npm.cmd test` for the API tests. The admin integration test runs when `MONGODB_TEST_URI` points to a disposable test MongoDB server. It creates and removes an isolated database.

### Admin profile

Use **Profile** in the admin sidebar to edit your display name or sign-in email and change your password. Each save requires your current password. Changing the login email or password invalidates existing sessions and prompts you to sign in again. The optional `displayName` field is stored on `admin_users`.
