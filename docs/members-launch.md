# Launch free Cosmic Nexus membership

The public site can stay on GitHub Pages. Supabase provides sign-in, the members’ library and private circles. Members sign in with a one-time email code and can create circles, redeem invitations, share research notes and post trip plans. Library items are published by the site operator.

## Connect the member service

1. Create or select a Supabase project for Cosmic Nexus. Apply [`20261111000000_members.sql`](../supabase/migrations/20261111000000_members.sql) once through the SQL Editor or a linked Supabase CLI project.
2. In Authentication, enable email sign-ups and email confirmation. Keep anonymous sign-ins disabled. Set the Site URL to the current `members.html` page on GitHub Pages. Update that URL to `https://cosmicnexus.xyz/members.html` when the custom domain is active.
3. Configure the email templates used by passwordless sign-in to show `{{ .Token }}` in the message. Configure a custom email sender under Authentication → SMTP Settings for public registration. Supabase’s default sender is restricted to project team addresses.
4. Set `url` and `publishableKey` in [`members-config.js`](../members-config.js) using the project URL and `sb_publishable_…` key. The settings are served publicly. Keep SMTP credentials, database passwords, and service or secret keys in the Supabase dashboard or another server-only environment.
5. Verify sign-in with a regular member address, then test an invitation with two separate signed-in accounts. Confirm that an unrelated member can read the published library and sees only their own circles. Publish the configured site after these checks.

The sign-in session is stored in the current browser tab. Library and circle content is stored in the project, so members can sign in from another device and find their work. Single-use circle codes expire in seven days. The member page creates short-lived links for private media when requested.

## Publish the first library items

Use the `nexus_library` table in the Supabase dashboard. Set `kind` to `article`, `film` or `research`, add a title, summary and plain-text body, and leave `published_at` empty while drafting. Set a publication date when it is ready for members. A date in the future schedules availability.

For a film or attachment, upload the approved file to the private `nexus-library` storage bucket and put its object path in `media_path`. Use a browser-playable format such as MP4 for films. The text, media files and drafts belong in Supabase. The public GitHub repository contains the application and database schema.

## References

- [Passwordless email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless)
- [Custom email sender](https://supabase.com/docs/guides/auth/auth-smtp)
- [Publishable and secret keys](https://supabase.com/docs/guides/getting-started/api-keys)
- [Private file access](https://supabase.com/docs/guides/storage/security/access-control)
