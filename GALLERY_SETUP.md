# Supabase cake gallery setup

The site is configured to use Supabase project storage and database tables. The browser uses the project's publishable key; it does not use a service-role or secret key.

## 1. Secure admin authentication

In the Supabase dashboard for this project:

1. Open **Authentication → Settings** and disable public sign-ups. This is important: authenticated users are allowed to upload.
2. Open **Authentication → Users** and add a user for the bakery administrator. Set a new, unique password in the dashboard; do not reuse a password that has been shared in chat or elsewhere.
3. Keep your account recovery email current and enable multi-factor authentication if available.

The login in the website's **Manage the cake gallery** section uses this Supabase Auth account. A Supabase dashboard login linked to GitHub is separate from a website Auth user.

## 2. Create the gallery table and storage bucket

Open **SQL Editor**, create a query, paste the contents of [`supabase/setup.sql`](./supabase/setup.sql), and run it. This creates the `cakes` table, a public-read `cakes` storage bucket, and row-level security policies. Visitors can view the gallery; uploads and deletes require a signed-in Supabase Auth user. If the gallery is already set up, rerun this SQL to add the delete permissions.

## 3. Upload and manage items

Sign in to the live website from its gallery management section, then upload an image or video with a name and optional description. Signed-in users also see a **Delete** button on each gallery item. Supported formats are JPG, PNG, WebP, GIF, MP4, and WebM. The maximum upload size is 50 MB.

Uploaded media is public because it is displayed on the public website. Do not upload private images or videos.

## Security

- The project URL and publishable key in `config.js` are intended for browser use. Row-level security and storage policies protect writes.
- Never put a Supabase `service_role` or secret key in this static website or commit one to GitHub.
- Keep public sign-ups disabled so visitors cannot create accounts and use authenticated upload policies.
- The gallery uses Supabase Auth sessions for sign-in and sign-out; the former browser-only password and localStorage gallery have been removed.
