# DZ Prime Academy: Redesign (Figma frames)

File: https://www.figma.com/design/x83rqZELMG7EA7xJkNG2WX (team "Freelancing", draft file "DZ Prime Academy: Redesign").
Deep link pattern: `https://www.figma.com/design/x83rqZELMG7EA7xJkNG2WX?node-id=<id with : replaced by ->`.
Design language: Arabic RTL first, black #050505, colours only from the logo palette, Phosphor Regular icons, no emoji, no gradient text, no pulse dots, no monospace. Data-driven widgets show "لا بيانات بعد" or labelled empty states; no invented numbers or names.

## Page 1 Foundations (page id 0:1)
| Node | Id |
|---|---|
| Foundations Board (palette, theme modes Black and Light, type, spacing/radius, logo usage) | 3:2 |
| Components (Button/Primary, Button/Secondary, Chip, Chip/Active, Input, NavItem, NavItem/Active, StatTile, EmptyState, Panel) | 2:127 |
| Icon library (31 Phosphor Regular icon components) | 2:64 |
| Brand sources (amber logo, silver logo, owner card reference) | 1:7, 1:8, 1:9 |

Variables: collections `Palette` (19 colours from the logo), `Theme` (14 semantic colours, modes Black and Light), `Scale` (space 4..64, radius control 8 / card 12 / pill). Text styles: Latin/Display, H1, H2 (Marcellus); Arabic/Display, H1, H2 (Reem Kufi); UI/Title, Body-L, Body, Label, Button, Caption (Readex Pro, Arabic and Latin).

## Page 2 Membership Cards (1:2)
| Node | Id |
|---|---|
| Membership Cards Board | 5:5 |
| VIP card section (front and back, 856 x 540 = CR80 at 10 px/mm) | 5:176 |
| Standard member card section (silver logo, front and back) | 5:349 |

## Page 3 Landing (1:3)
| Node | Id |
|---|---|
| Landing / Desktop 1440 | 9:10 |
| Landing / Mobile 390 | 9:177 |
| FeatureCard (local component) | 9:5 |

## Page 4 Dashboards (1:4)
| Role | Desktop 1440 | Mobile 390 |
|---|---|---|
| Student (لوحة الطالب) | 11:5 | 11:197 |
| Teacher (مساحة الأستاذ) | 11:363 | 11:464 |
| Ambassador (مساحة السفير) | 11:544 | 11:614 |

## Page 5 Admin (1:5)
| Node | Id |
|---|---|
| Admin / Operations / Desktop 1440 (grouped sidebar, filter chips, requests table with empty state) | 13:5 |
| Admin / Finance / Desktop 1440 (stat tiles, one-series chart empty state, payments table) | 13:101 |
| Admin / Operations / Mobile 390 (list instead of table) | 13:202 |

## Page 6 Auth, Dawarat, Exams, Community (1:6)
| Node | Id |
|---|---|
| Auth / sign in modal | 14:45 |
| Auth / sign up modal | 14:69 |
| Dawarat (courses catalogue) Desktop 1440 | 14:97 |
| Exams Desktop 1440 | 14:168 |
| Community Desktop 1440 | 14:215 |
| Local components: CourseCard, PostCard, ExamRow (data slots) | on page 1:6, y = -500 |

## Not finished or limited (honest list)
- Font: IBM Plex Sans Arabic (named in SLOP-AUDIT section 3) is not available in Figma. Readex Pro (Arabic + Latin) stands in for UI/body; Reem Kufi for Arabic display; Marcellus for Latin wordmark lines. Swap via next/font if Plex is preferred.
- Auth modal, dawarat, exams, community: desktop only. No mobile frames for those four, and no mobile auth sheet.
- Only two admin tabs (operations, finance) as asked; the other 11 tabs are only listed in the sidebar.
- Course, exam and post screens are skeletons with labelled data slots plus empty states, because real records do not exist; nothing is invented. Once data exists the slots need real-content review.
- Arabic RTL is built by hand: Figma auto-layout has no RTL flag, so rows are ordered right-to-left manually and text is right-aligned. Mixed Arabic and Latin strings (for example "DZ PRIME ACADEMY" inside the card ownership line) were checked visually only.
- VIP card ribbons are vector paths with gradient fills approximating the reference; they follow its composition but are not a pixel trace. The gold speckle is about 60 small dots per side. Hairline frame is 2 px (spec said 0.4 mm = 4 px; 2 px looked closer to the reference).
- Logo images are raster fills from the repo PNGs (black backgrounds). Both logo versions work on black only.
- Standard card uses a wide sapphire band next to the platinum band, which reads bluer than the "silver logo palette" brief; easy to tone down.
- Hover, focus and error states of components are not drawn; only default and active (NavItem, Chip).
- Verified with screenshots: foundations board, both cards boards, landing desktop and mobile, student desktop and mobile, teacher desktop and mobile, ambassador mobile, admin operations and finance desktop, auth sign-up, dawarat, community. Not individually screenshotted after final tweaks: ambassador desktop, admin mobile, exams, auth sign-in (built with the same components and helpers).
- Contrast: gold #F2AA34 on black and black text on gold pass AA; muted text #B0B0B0 on #050505 passes. Light mode accent uses #9A6B1E for text. Not run through an automated checker.
- No Figma Code Connect mappings and no prototype links were created.
