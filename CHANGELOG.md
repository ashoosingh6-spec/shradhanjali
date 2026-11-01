# Changelog

## 3.0.5
- Uses the uploaded 1024 × 1536 reference poster itself as the exact card artwork and typography source.
- Adds a dynamic recipient overlay at the original recipient line.
- श्रीमान is selected by default; श्रीमती is the alternate checkbox choice.
- Aligns PNG and PDF export to the source poster's 2:3 ratio.
- Public and Admin previews share the same template asset and overlay component.

## 3.1.0
- Card text is now fully editable: the poster artwork is a clean plate (`public/shradhanjali-plate.jpg`) and every field is rendered live on top of it.
- Admin can upload the portrait directly (stored in Supabase Storage bucket `portraits`); the original portrait is the default.
- Save now verifies that a row was really updated and explains the RLS/admin_user_id problem instead of failing silently.
- New `supabase-fix.sql` for existing projects.
- Fonts bundled from npm (@fontsource): Noto Serif Devanagari 700/800 (title, name), Noto Sans Devanagari 400/500 (message, family details), Mukta 600 (schedule, ribbons). No font files needed.
