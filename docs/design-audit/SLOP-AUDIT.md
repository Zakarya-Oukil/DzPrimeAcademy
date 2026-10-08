# DZ Prime Academy design slop audit

Read-only audit. Evidence: source greps, `impeccable detect src` (252 lines), axe-core 4 (WCAG A/AA) on every visited page, Playwright screenshots at 1440 and 390, logo pixel sampling. Not covered: free-student and commercial roles (login limiter 429 during automation), modals (read from code only). No source files were edited.

## 1. Executive summary
- The UI is a template stack: Plus Jakarta Sans + Cairo, lucide icons, lime-400 CTAs, purple/rose/emerald/sky chips, gradient gold text, glass panels, bento cards, hundreds of text nodes under 12px.
- It does not use the logo palette only. Tailwind class counts across src: lime 478, emerald 286, rose 222, sky 76, purple 59, blue 36, violet/indigo 18. Plus brand hexes for social (#25d366, #229ed9, #0077b5, #5865f2, #1877f2).
- Light mode is a warm cream (#FAF7F2) hero card; the owner wants black. Dark mode accent is gold but primary buttons are lime in both.
- Placeholder-sounding copy: "CREXTIO ACADEMIC WORKSPACE" (teacher/page.tsx:229), "GOLDEN VIP ACTIVE" (student/page.tsx:89), "Smart Bot" (ambassador/page.tsx:384, teacher/page.tsx:309, ThreeStepsSection.tsx:18), "Golden VIP Membership" (UpgradeModal.tsx:89), "Algeria's #1 EdTech & Fintech Platform 2026" and static stats "10K+ / 50K+ / 4.9 (2.3K reviews)" (LandingHero.tsx HERO_COPY).
- Impeccable detector: 70 gray-on-color (text-slate-950 on bg-lime-400), 9 gradient-text, 3 bounce-easing, 2 overused-font, 2 ai-color-palette.
- axe (WCAG A/AA, desktop): every page has 1 critical button-name (unlabeled navbar icon button) and serious color-contrast (3 to 26 nodes; /ar/exams 26; /ar/card also label x3 + select-name; 404 page has no html lang).
- Mobile 390: no horizontal overflow on any visited page. /ar/exams has about 170 text nodes under 12px.
- Brand gaps: no black backgrounds, sapphire from the logo leaves unused, no platinum tokens, VIP card does not follow the reference.

## 2. Palette audit
### Logo palette sampled from the image files
| Role | Hex (sampled) | Source |
|---|---|---|
| Black | #050505 to #101010 | logo and card backdrop (largest bin) |
| Navy field | #00163D, #021A46, #020C25 | head and banner |
| Gold highlight | #F4BF61, #F0D070, #F0F0B0 | amber logo K and letters |
| Gold core | #F2AA34, #F0B030, #D09030 | amber logo rim |
| Gold shadow | #907030, #705030 | card reference ribbon edge |
| Sapphire leaf | #0880F0, #00A4FD, #1050D0 | leaves |
| Sapphire light | #6DB1D8 | silver logo leaf |
| Platinum | #FAFCF9, #F0F0F0, #D0D0D0, #B0B0B0, #909090 | silver logo, card white ribbon |
| Platinum shadow | #67646B, #505050 | silver logo |

### Proposed tokens
```
--black #050505   --ink #0B0B0D   --surface #111114   --surface-2 #17171B
--navy #021A46    --navy-deep #00163D
--gold-hi #F4D58A --gold #F2AA34  --gold-lo #9A6B1E
--sapphire #0880F0 --sapphire-lo #1050D0 --sapphire-hi #6DB1D8
--platinum #E8EAEC --platinum-lo #909090
--line rgba(242,170,52,.28)  --text #F2F2F0  --text-muted #B0B0B0
```
Functional states: success = sapphire-hi with a check icon; warning = gold; danger = one muted red (#C0463A) for destructive only. No lime, purple, emerald, rose, sky.

### What exists vs logo
- tailwind.config.ts: gold-500 #D4AF37 is a flat yellow gold, not the logo's warmer amber #F2AA34; navy-950 #040711; dzBlue #1E40AF / #3B82F6 / #38BDF8 (sky neon) is not the logo sapphire #0880F0.
- globals.css hard-codes #d4af37, #f5d061, #aa771c, and lime #a3e635 in .animated-gradient-text.
- 62 files use raw hex. Top: #d4af37 x65, #f5d061 x24, #25d366 x20, #10b981 (emerald) x15. About 15 near-identical navy backgrounds (#0b1021, #0a0e1a, #090e1f, #0c1428, #0d1429, #0b1224 ...) should collapse to 3 tokens.
- Tailwind color-family class counts: slate 1359, gold 1178, gray 741, lime 478, navy 314, amber 307, emerald 286, rose 222, sky 76, purple 59, blue 36, yellow 26, red 15, dzBlue 10, violet 9, indigo 9.

## 3. Typography audit
- Fonts: Plus Jakarta Sans (Latin), Cairo (Arabic), plus Outfit and Tajawal loaded but unused, via a blocking CSS @import from Google Fonts at globals.css:1 (not next/font). Detector flags Plus Jakarta Sans as overused. 289 font-mono uses for micro-labels (ui-monospace fallback).
- Sizes on landing: 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 60 px. 12px dominates (about 300 nodes). 27 to 43 nodes under 12px on landing, about 170 on /ar/exams. Floor should be 13px for UI text, 16px body.
- Headings are font-black everywhere, gradient-clipped on key words, with a hand-drawn SVG underline in the hero.
- Proposed pairing (Arabic and Latin in one system): IBM Plex Sans Arabic for UI and body (Arabic + Latin, weights 400 to 700); Readex Pro or Reem Kufi for Arabic display headings; a classical Latin capital face (Marcellus) only for wordmark-style lines (card name, section titles in Latin) to echo the logo lettering. Self-host through next/font, display swap. Scale 13 / 15 / 17 / 20 / 24 / 32 / 44, body 16, line-height 1.7 Arabic and 1.5 Latin, weights 400/600/700 only.

## 4. Page-by-page findings (v1)
| Page | Element | Problem | Sev | Fix |
|---|---|---|---|---|
| All public | Top strip | Green pulsing dot plus flag emojis in the language switcher, slogan line | M | text-only switcher, no dot |
| All | Navbar | Gold gradient sparkle icon button has no accessible name (axe critical) | H | aria-label or remove |
| All | h1 | Logo wordmark is an h1 on every page, then the page h1 | M | logo as link not heading |
| / | Hero card | Cream #FAF7F2 rounded-[2.5rem] card, blurred gold/purple blobs, dot grid, gradient-text highlight word, hand-drawn underline, magnetic gradient CTA (LandingHero.tsx) | H | black full-bleed hero led by the logo, solid gold CTA |
| / | Stats | 10K+ / 50K+ / 4.9 are static strings | H | remove or bind to DB |
| / | Category chips | purple, amber, rose, gold, sky chips (LandingHero.tsx CATEGORIES) | M | one gold/platinum chip style |
| /exams | List | about 170 sub-12px nodes, mono micro-labels, 26 contrast failures | H | rebuild at 13px+ |
| /card | Form | 3 inputs without labels, select without name | H | add labels |
| /student, /activate, /dawarat, admin tabs | Primary buttons | text-slate-950 on bg-lime-400 (student/page.tsx:62,82,105; activate:129,161; dawarat:136,209,293; AdminOperationsTab:332,533; etc.) | H | solid gold, black text |
| /student | Badge | "GOLDEN VIP ACTIVE" (page.tsx:89) | M | "عضو رسمي / Official member" |
| /teacher | Header | "CREXTIO ACADEMIC WORKSPACE" and comments naming Crextio / Learnova (teacher/page.tsx:222-342, LandingHero.tsx) show template provenance | H | rename, rewrite |
| /teacher, /ambassador | Bot | "Smart Bot" | M | "المساعد" |
| /admin | 13 tabs | icon per tab, lime active state, duplicated icons, Arabic labels with English in parentheses "(Dawarat)", "(Offers & Promos)", "(Landing Page)" | M | one language per label |
| signed-out dashboards | Auth gate | white card, lime shield tile, lime CTA | M | black gate with logo |
| 404 | Not found | unstyled, no html lang | M | styled 404 |

### 4b. Runtime findings (Playwright, 1440 and 390, roles: visitor, paid student, teacher, ambassador, owner; screenshots in the scratchpad audit-shots folder)
Coverage: visitor (/ar /en /fr, dawarat, ambassadors, community, exams, leaderboard, bot, card, activate, reset-password, verify, profile, 404), paid student (student, card, dawarat, community, bot, /en/student), teacher (6 tabs), ambassador (5 tabs), owner/super admin (13 tabs plus /en and /fr). Not captured: free student and commercial (login limiter returned 429 after repeated automated logins; free student renders the same shell as paid), and modals (auth, settings, upgrade, checkout, post studio) were only read from code. Mobile 390: no horizontal overflow anywhere; full-page heights are long (admin operations 10,559 px).

| Page | Evidence | Problem | Sev | Fix |
|---|---|---|---|---|
| Landing / (light) | screenshot visitor-_ar-d | Yellow arch + stock-style student photo (hero-student.png) with floating pill cards, green leaf, purple clock, sparkle; lime and emerald and purple chips; second hero-sized yellow gradient banner "ميزتك التنافسية"; green gradient card; lime "فعّل بطاقتك" and "أنشئ حسابك" buttons; dark navy blocks inside a cream page (theme flips mid-scroll). Reads as a stock EdTech template (Learnova) | H | one black page, logo hero, no stock photo, no rainbow |
| Landing | empty states | "ستظهر الدورات هنا قريباً" empty box and three stat tiles with 0 values and dashes ("موضوع امتحان محتوى") | H | hide until real data |
| Landing | Navbar | logo is plain text "DZ Prime Academy" with no logo image; the real logo only appears small in the footer with blue "DZ PRIME" text | H | use the logo file in nav and hero |
| All logged-in pages | Floating bot | gold pill "بوت الامتحانات الذكي" with a green pulse dot overlaps content on every page (covers calendar, assignments, chart, footer text) | H | dock bottom-corner icon, no pulse, never over content |
| Student dashboard | screenshot studentpaid-_ar_student | Light theme body, dark sidebar with lime active item, lime "ترقية فورية" button, lime/yellow sidebar card "بطاقة العضوية الرقمية", greeting "مرحباً بعودتك, Audit" repeated twice (topbar and h1) plus emoji wave twice | H | single greeting, black theme, gold |
| Student dashboard | Logic/copy | Paid student sees both "GOLDEN VIP ACTIVE", a "VIP GOLD" badge in the top bar and a "GO PREMIUM / GOLD VIP" upsell card at once | H | show upsell only to free users |
| Student dashboard | Course cards | Test titles "c" and blank, "3-", rating "99.0" with star, mono "UNIVERSITY_LMD" enum shown to users | M | map enums to labels, hide invalid |
| Student sidebar | badges | "جديد", "Live", "PRO", "TOP" tag pills on four of seven items, mix of English tags in Arabic UI | M | remove |
| Student / all | Calendar | Month grid mirrored in RTL with numbers reversed (Sunday column on the right but dates run 4,5,6...), lime today square | M | fix RTL order |
| /card | screenshot studentpaid-_ar_card | Card is black with gold but plain: no ribbons, tiny logo box beside "DZ PRIME", Latin name large, chip "عضوية ذهبية", "CARD.VALIDTHRU" mono label with "-" value, garbled bidi in the location line "(الجزائر العاصمة) W.16"; eyebrow "DIGITAL CARD STUDIO & EXPORT"; 3 unlabeled inputs and unnamed select (axe) | H | rebuild per section 6 spec |
| /card | Buttons | Five different button styles: gold, navy, navy outline, ghost link, light blue, all rounded differently | M | two button types |
| Teacher | screenshot teacher-_ar_teacher | Cream/yellow page, "CREXTIO ACADEMIC WORKSPACE" eyebrow, mono "CCP PAYOUT LEDGER" and "LIVE MEET SESSIONS" captions, tab label "(Bento) استوديو التدريس", "VIP DZ-TCH-16" yellow pill, coloured stat numbers (green 1, gold 1, navy 1), earnings "ج.د 0" with status chip "Active" | H | rename, drop mono captions, one number colour |
| Teacher | Weekly strip | The days row is crammed into one pill with the current day as a black tag overlapping digits; unreadable | H | proper 7-column week |
| Teacher | Empty area | content ends at 800px then 200px void above the footer | L | |
| Ambassador | screenshot ambassador-_ar_ambassador | Near-black page under a white navbar and white footer cards (three themes on one page); header: "فضاء السفير: Audit Ambassador" with a stray "x" under title and under navbar greeting; leaked i18n key "common.copy" on the copy button; purple $ icon; large empty left half under the stats (layout leaves 300px void); mono labels "WILAYAS" | H | fix key, single theme, layout |
| Admin financial | screenshot owner1-_ar_admin_financial | Navbar and footer light but body dark navy; mono Arabic ("نظام البث والمدفوعات: متصل" in monospace, which breaks Arabic joining: letters render disconnected); donut chart uses gold/emerald/sky; bars use gold; "SUPER ADMIN (Level 100)" badge; tab strip is clipped off screen at the left edge ("الدورا" cut) with a faded active tab; numbers in 12px mono; "+999,999" pending amount and "img src=x onerror=alert(1)" request name are test data visible in the UI (data, but the list renders it plainly) | H | Arabic never in mono, consistent theme, wrap/scroll tabs with arrows |
| Admin | Tab strip | 13 tabs in a single horizontally clipped pill row; labels like "طلبات التفعيل والمدفوعات", "العروض والتخفيضات (Offers & Promos)" | M | left sidebar nav grouped by job |
| Admin operations mobile | 10,559 px tall, 170 text nodes under 12px | Needs table/list redesign | H | |
| /fr, /en | Mixed language | /fr/admin h1 reads "Centre de Commandement Admin" but /ar uses a different title; /en/admin welcome in English with French title; /fr mobile landing threw a "SyntaxError: Invalid or unexpected token" page error once (dev); hero H1 text "Apprenez tout." etc. translated but the footer, stats, chips remain Arabic or French in /en ("Informatique & Dev", "Économie & Gestion" shown on /en landing) | M | single dictionary |
| Auth gate | screenshot teacher (signed out) | White rounded-3xl card, lime shield tile, lime CTA on slate page with floating bot widget | M | black gate |
| axe totals | per page | button-name 1 critical on every public page (gold sparkle button in navbar), 3 on /admin#settings, 19 unnamed buttons on /admin#courses mobile; color-contrast 3 to 60 nodes (/fr/admin#operations 60); label/select-name on /card, teacher profile (6), ambassador profile (7), landing admin (8), footer admin (7 selects) | H | |

## 5. Cliche / slop catalogue (ranked)
1. Lime-400 + slate-950 primary button (478 lime classes, 70 detector hits).
2. Rainbow chips (purple, rose, emerald, sky) breaking the palette.
3. Gradient text (.text-gold-gradient, .animated-gradient-text with a lime stop; 146 gradient usages).
4. Glassmorphism (49 backdrop-blur; .glass-panel-light/dark) and gold glows (.gold-glow, 44 shadow-glow).
5. Cream hero card with blurred blobs and dot grid, oversized radii (147 rounded-3xl or larger).
6. Mono micro-labels, uppercase tracked eyebrows (31), 416 text-[8..11px].
7. Pulsing dots (23 animate-pulse), 3 animate-bounce, canvas-confetti (10 hits).
8. Emoji as UI: 108 pictographs in src (lightning 15, lock 9, mail 6, key 6, star 5 ...) mostly emails and admin tabs, plus flags in the navbar.
9. lucide-react in 65 files (owner rule: Phosphor).
10. Spotlight cursor cards, MagneticButton, wilaya marquee with no function.
11. Template provenance names (Crextio, Learnova).
12. Unsourced numbers and "#1 platform 2026" claims.
13. Mixed AR/FR/EN strings; 286 isRtl ternaries, copy hardcoded in components.
14. Em dashes in 11 TSX lines.

## 6. Kill-the-slop plan (summary)
- Tokens: replace tailwind gold/navy/dzBlue with section 2; delete lime/emerald/rose/purple/sky; one radius scale (card 12px, control 8px, pill only for chips).
- Backgrounds: black #050505 everywhere, one theme.
- Buttons: solid gold (#F2AA34, black text) primary, platinum outline secondary. No gradients, no magnetic hover.
- Remove glass, glows, spotlight, marquee, pulse dots, gradient text, confetti, blobs, dot grids, emoji, flags.
- Icons: Phosphor, single stroke weight.
- Copy: plain, one language per surface, no superlatives, no invented numbers; rename Crextio / Smart Bot / Golden VIP.
- Motion: state feedback only (150-200ms ease-out), one hero entrance, honour prefers-reduced-motion.

### VIP card spec (matches media_1788954516122.jpg)
Size CR80 85.6 x 54 mm, radius 3.5 mm, black #050505 with fine gold speckle on the ribbon side.
Front: sweeping curved ribbons entering top-left and flowing to bottom-right; one gold band (#F4D58A > #F2AA34 > #9A6B1E), one platinum band (#FAFCF9 > #D0D0D0 > #909090), thin black gap between; 0.4 mm gold hairline frame; amber logo centred in the upper half (about 36% card width); empty rounded plate under the logo for the member name; bottom-left gold tab with angled right edge: "عضو رسمي" over "OFFICIAL MEMBER" in black.
Back: mirrored ribbons on the left; logo top; square gold-hairline window (photo or verify QR); vertical gold divider; curved gold line; two fields each with a gold-circle icon: "اسم العضو / MEMBER NAME" and "الصفة / MEMBER ROLE" (values white); footer in small platinum text: "هذه البطاقة ملك حصري لمنصة DZ PRIME ACADEMY وهي غير قابلة للتحويل".
Build ribbons as inline SVG paths so html-to-image exports sharply.

## 7. Not built / fake
- Landing stats and rating are static strings.
- MockCheckoutModal on landing bundles is a mock checkout.
- Footer "Smart Bots / Mobile App (soon)" are config text (footerConfig.ts:301,351).
- Community, leaderboard, ambassadors are empty on a fresh DB ("0 سفراء", "كن أول من يشارك").
