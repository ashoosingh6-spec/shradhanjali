# Digital Shradhanjali Web App – Admin Editable v2

## What changed
- More polished black-and-white memorial card.
- Visitors can enter a recipient name and optionally upload a portrait.
- Visitors can download PDF or PNG and share the generated file via the device share sheet.
- `/admin` is protected by Supabase Auth.
- Only the designated Admin UUID can save the card wording and custom CSS.
- Admin can edit structured wording fields, family lines, event rows, full JSON source and custom CSS.
- Changes are saved to Supabase and appear on the public page.

## Setup
1. Create a Supabase project.
2. In Supabase Authentication > Users, create the Admin user with email/password.
3. Copy the Admin user's UUID.
4. Open `supabase-setup.sql`, replace `YOUR_ADMIN_AUTH_USER_UUID` with that UUID, then run the SQL in Supabase SQL Editor.
5. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Run:
   ```bash
   npm install
   npm run dev
   ```
7. Open `http://localhost:3000` for visitor card maker and `/admin` for Admin Login.

## Admin permissions
The browser UI is not the security boundary. Supabase Row Level Security enforces that only the UUID assigned in `memorial_card.admin_user_id` can update the saved card. Public visitors can read the published card content but cannot update, insert or delete it. Never use the Supabase service-role key in frontend environment variables.

## WhatsApp sharing limitation
On supported Android browsers over HTTPS, the Share button passes the generated PDF/PNG to the native share sheet; choose WhatsApp. If file sharing is unsupported, the file is downloaded and WhatsApp opens with a prepared text. The visitor must attach the downloaded file manually. A normal website cannot silently attach files through a WhatsApp `wa.me` URL.

## Notes
- This version edits the shared master card wording/design. Recipient name and visitor-selected portrait remain per-visitor and are not saved to the master.
- The sample deceased/family/event details are inherited from the reference card. Verify and edit them in Admin before public use.
- For production, self-host the Devanagari font files if you need reliable rendering without Google Fonts network access.


## Version 3 — exact shared preview

Admin `/admin` and public `/` now render the **same `components/MemorialCard.tsx` component** with the same `app/public.css` stylesheet. Admin preview reflects unsaved wording, events, photo URL, custom CSS, and an optional preview-only recipient name. Visitor-specific names are not saved. The preview is horizontally scrollable on narrow screens to preserve A4 layout.

The generated PDF/PNG is a raster capture of the rendered card; it is not an exact copy of the original uploaded reference picture. Verify sample content before publishing. Run `npm install && npm run build` locally and configure Supabase as explained above before deployment.
