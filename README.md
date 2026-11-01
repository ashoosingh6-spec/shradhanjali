# Digital Shradhanjali Web App — v3.0.5

## Exact reference-poster mode
- The exact user-supplied 1024 × 1536 poster image is stored at `public/shradhanjali-template.png`.
- The artwork, portrait, decorative elements, printed Hindi text and typography are rendered directly from that original image. They are not recreated with HTML fonts.
- Only the recipient line is dynamic: visitors select श्रीमान (default) or श्रीमती and type the recipient name. The dynamic text overlays the original printed recipient line.
- Admin preview and public preview use the same component and exact same image asset.
- PDF export uses the poster's native 2:3 aspect ratio (210 × 315 mm); PNG export captures the same rendered preview.
- WhatsApp uses native file sharing where supported; otherwise it downloads the file and opens WhatsApp for manual attachment.

## Setup
1. Create a Supabase project.
2. Create the Admin user in Supabase Authentication.
3. Replace `YOUR_ADMIN_AUTH_USER_UUID` in `supabase-setup.sql` and run it in Supabase SQL Editor.
4. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Run `npm install`, `npm run build`, then deploy the repository to Vercel with the same environment variables.

## Important limitation
This version treats the supplied poster as a fixed raster template to preserve its exact artwork and original fonts. Text already printed in that image (deceased name, dates, family names, schedule and contact details) is not editable through the legacy structured wording fields. To change those details while preserving the same design, a new master poster image or a fully layered original design file is required. Only the recipient title and name are editable in this build.

Do not put a Supabase service-role key in a `NEXT_PUBLIC_` variable.
