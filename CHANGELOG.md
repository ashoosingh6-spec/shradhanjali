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

## 3.2.0
- **No more overlapping text.** The card is now drawn on a canvas; every text block is measured with the real font and wrapped / shrunk to its zone. The message box (recipient, मान्यवर, intro, death line, invitation) is laid out in two fitted zones above / below the name plaque, so lines can never touch each other or the frame, whatever wording the admin enters.
- **Compatible with every device.** Removed CSS container units (`cqw`) and the DOM→image library (html-to-image), which broke on older Android / iOS Safari. The preview now scales to the screen width instead of a fixed 1024 px box.
- **Much smaller files.** Export is JPEG (1536 × 2304) instead of an uncompressed 2048 × 3072 PNG: the PDF dropped from ~25 MB to well under 1 MB.
- **Faster share.** The PDF / JPG is prepared in the background 0.6 s after the visitor stops typing, so Download and WhatsApp share respond instantly (and `navigator.share` runs while the tap is still valid). jsPDF is loaded only when needed.
- "PNG Image" option replaced by "Image (JPG)" (smaller, WhatsApp-friendly).
- Removed the remote Google Fonts @import; fonts come only from the bundled @fontsource packages.
- Cleaned two leftover specks from the plate artwork.

- Plate artwork: repainted the black ribbons (शोकाकुल, विनीत, श्राद्ध-कार्यक्रम, title, स्वर्गीय plaque) and the name plate to remove blurred leftovers of the old text, so no whitish patches show behind the new text.

## 3.3.0
- **Card 2 added** (landscape 1536x1024, same look as the supplied design). Wording comes from the same database content as Card 1 (new optional field `salutation2` = "सेवा में," editable in admin). The visitor picks Card 1 / Card 2; preview, PDF (landscape page) and JPG follow the choice. Admin preview has the same switch.
- New assets: public/shradhanjali-plate-2.jpg, public/default-portrait-2.jpg. Added Noto Sans Devanagari 700/800 font imports.

## 3.3.1
- Portrait now fills the whole frame in both designs. Card 1: the photo covers the full oval opening (the plate's sample man is no longer visible) and the lilies / diya flame are painted back in front. Card 2: photo fills the frame edge to edge (no white gaps), roses stay in front. Plate 2 / default-portrait-2 regenerated.

## 3.4.0
- **Photo placement rebuilt.** Each design now has an exact photo mask (public/portrait-mask-1.png, portrait-mask-2.png): the photo is cut to the frame opening and sits *behind* the lilies / roses / diya flame, with no gaps or straight edges. Plates were cleaned of the sample photo (plate.jpg, plate-2.jpg).
- **Admin: photo zoom + position sliders** (portraitZoom / portraitX / portraitY). Preview updates live; the same placement is used by both cards. EXIF rotation of uploaded photos is respected.

## 3.4.1
- Card 2 now starts directly with श्रीमान / श्रीमती (no "सेवा में,"); paragraphs use the freed space with a slightly larger font. Removed the salutation2 field.
