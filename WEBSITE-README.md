# Kerwin Springer — Website Mockup

This is the MVP mockup for **kerwinspringer.com**, a single-page marketing site for Kerwin Springer's Student Hub brand. It includes a dedicated past paper library and PDF viewer.

---

## File Structure

```
site-mockup/
  index.html          ← Main single-page website
  papers.html         ← Past Paper Library (storefront-style browsing page)
  viewer.html         ← PDF viewer (no-download, canvas-based via PDF.js)
  WEBSITE-README.md   ← This file
  img/
    world/            ← Photos for the Kerwin's World gallery
      guyana/         ← 01-guyana.jpg, 02-anna-regina.jpg, 03-guyana-banner.png
      jamaica/        ← 01-jamaica.png
      grenada/        ← 01-grenada.jpg
      stvincent/      ← 01-stvincent.jpg
      dominica/       ← 01-dominica.jpg
      stlucia/        ← 01-stlucia.png
      trinidad/       ← 01-asja-boys.png ... 11-with-keshav.jpg (11 photos)
      general/        ← 01-on-the-move.jpg (uncategorized / multi-country photos)
  papers/
    csec-math/
      january/        ← 15 PDFs (Jan 2010–2026)
      june/           ← 15 PDFs (June 2010–2025)
      paper1/         ← 1 PDF (answer template)
    add-math/
      june/           ← 7 PDFs (2018–2025, gap at 2020)
    sea/
      past-papers/    ← 4 PDFs (2023–2026)
      practice-tests/ ← 13 PDFs (Sample Exam 1–13)
```

---

## How Each Page Works

### index.html — Main Website

A single-page site with these sections (top to bottom):

1. **Hero** (`#hero`) — Caribbean map background, animated TV with rotating stats/announcements, Kerwin cutout. TV items are clickable — stats link to `#world`, announcements link to their relevant section.

2. **Student Hub** (`#hub`) — Cards for course offerings (CSEC, CAPE, SEA, etc.).

3. **Free Tools** (`#tools`) — Interactive learning tools like Physics Formula Mastery, Circle Theorems apps, etc.

4. **Past Papers** (`#papers`) — Three subject rows linking to `papers.html`. Shows paper counts.

5. **Kerwin's World** (`#world`) — Stats bar (2M+ students, 170K+ YouTube, etc.), 8 country/school cards with photos, clickable to open the lightbox gallery. Social media links at bottom.

6. **Footer** — Learn links (Free Tools, Past Papers), Student Hub links (all point to `#hub`), Contact Us (WhatsApp link to +18683101306), social icons. Tagline: "100% CARIBBEAN MADE".

#### TV Announcements Config

The TV items are configured in the `tvItems` array:

```javascript
const tvItems = [
  {type:'title', text:'HELPING STUDENTS WIN', link:null},
  {type:'stat',  num:2000000, display:'2M+', label:'Students Helped', link:'#world'},
  {type:'announcement', tag:'Student Hub', text:'CXC Crash Courses Now Open', link:'#hub'},
  // ... more items
];
```

Each item can have a `link` property (a CSS selector) that scrolls to that section on click.

#### Lightbox Gallery Config

Photos are organized in the `worldAlbums` array:

```javascript
const worldAlbums = [
  {
    id: 'guyana', name: 'Guyana', flag: '🇬🇾',
    photos: [
      {src: 'img/world/guyana/01-guyana.jpg', caption: 'Description here'},
      // ...
    ]
  },
  // ... more albums
];
```

Country cards in the World section map to albums by text matching. Clicking a card opens the lightbox with that country's album. Inside the lightbox, users can switch albums via tabs without closing.

### papers.html — Past Paper Library

A dedicated storefront-style page for browsing past papers. Features:

- **Hero banner** with stats (paper count, subject count, years of coverage)
- **Subject shelf** — Horizontal scrollable cards: CSEC Mathematics (blue), Additional Maths (purple), SEA Mathematics (green)
- **Grouped sections** — CSEC splits into January/June sittings + Paper 1 Resources. SEA splits into Past Papers + Practice Tests.
- **Paper cards** — Year in big bold type, "FREE" badge, PDF tag, arrow. Click opens viewer.

Papers are configured in two arrays:

```javascript
const subjects = [
  {id:'csec-math', name:'CSEC Mathematics', icon:'📐', color:'#2563eb',
   groups:['January Sitting','June Sitting','Paper 1 Resources']},
  // ...
];

const papers = [
  {subject:'csec-math', group:'January Sitting', year:2026, display:'2026',
   title:'January 2026', file:'papers/csec-math/january/CSEC-Maths-Jan-2026.pdf'},
  // ...
];
```

### viewer.html — PDF Viewer

A no-download PDF viewer powered by PDF.js. Features:

- Canvas-based rendering (no native browser PDF viewer)
- CSS transform-based zoom (instant, no re-render)
- Zoom range: 0.5x to 3.0x in 0.25 increments
- Ctrl+scroll wheel zoom
- Keyboard: Arrow keys for pages, +/- for zoom, 0 for fit, Escape to go back
- Right-click and drag disabled on canvases
- Student Hub branded loading screen (1.5s minimum display)

Opens via URL params: `viewer.html?file=ENCODED_PATH&name=ENCODED_TITLE`

---

## How to Add New Content

### Adding Photos

1. Drop the photo into the correct country folder: `img/world/{country}/NN-description.ext`
   - Use sequential numbering: `02-new-photo.jpg`, `03-another.jpg`, etc.
   - For uncategorized photos, use `img/world/general/`
2. Add an entry to the `worldAlbums` array in `index.html`:
   ```javascript
   {src:'img/world/guyana/04-new-photo.jpg', caption:'Description of the photo'}
   ```

### Adding a New Country Album

1. Create the folder: `img/world/newcountry/`
2. Add numbered photos inside
3. Add a new album object to the `worldAlbums` array in `index.html`
4. Add a new card in the Kerwin's World HTML section

### Adding Past Papers

1. Drop the PDF into the correct folder:
   - CSEC Maths January: `papers/csec-math/january/`
   - CSEC Maths June: `papers/csec-math/june/`
   - Additional Maths: `papers/add-math/june/`
   - SEA Past Papers: `papers/sea/past-papers/`
   - SEA Practice Tests: `papers/sea/practice-tests/`
2. Add one line to the `papers` array in `papers.html`:
   ```javascript
   {subject:'csec-math', group:'January Sitting', year:2027, display:'2027',
    title:'January 2027', file:'papers/csec-math/january/CSEC-Maths-Jan-2027.pdf'},
   ```
3. Update the paper count in `index.html` (the subject rows in `#papers` section)

### Adding a New Subject (Full Checklist)

**papers.html:**
1. Create the folder structure: `papers/new-subject/group-name/`
2. Add a subject entry to the `subjects` array (id, name, icon, color, groups)
3. Add paper entries to the `papers` array
4. Add teacher card in `selectSubject()` function (inline hero card with onclick → modal)
5. Add teacher modal at bottom of file (photo, bio, qualifications, WhatsApp CTA)
6. Add hero color mapping in the `heroColors` object

**viewer.html:**
7. Add teacher detection in `currentTeacher` logic (check `pdfFile.indexOf('folder-name')`)
8. Add teacher data to the `teachers` object (name, img, modal ID, desc, CTA, labels)
9. Add teacher modal at bottom of file (gradient, photo, bio, quals, WhatsApp CTA)

**index.html:**
10. Update paper count + subject count in hero stats
11. Add subject icon card in the papers grid section
12. Update TV broadcast bar (count + subject in scrolling list)
13. Update FAQ "How far back" — add new subject coverage range
14. Update FAQ "What subjects are covered?" — add to Past Papers list
15. Update FAQ "Who writes the solutions?" — add teacher name + credentials

---

## Local Development

For PDF viewing to work locally, you need a local server (browser security blocks JavaScript file access over `file://` protocol):

```bash
cd site-mockup
python3 -m http.server 8000
```

Then visit: `http://localhost:8000`

The site itself (index.html) works fine opened directly in a browser. Only the PDF viewer requires the local server.

---

## Tech Stack

- **HTML/CSS/JS** — No frameworks, no build step. Everything is vanilla.
- **Google Fonts** — Poppins (400, 600, 700, 800)
- **PDF.js v3.11.174** — Canvas-based PDF rendering in viewer.html
- **Design Language** — Dark navy (#0a0f1a) background, gold (#d4912a) accents, Poppins font, rounded cards with subtle gradients

---

## Live Site Mapping

This mockup corresponds to the live site at kerwinspringer.com. Key differences from the current live site:

- The mockup has a more polished, modern design with dark theme
- Past papers are organized in a dedicated storefront-style library
- The PDF viewer prevents direct downloads
- The gallery uses a lightbox with album tabs (live site has a basic carousel)
- Captions in the gallery are sourced from the live site's "WHAT I'M UP TO" page

Photos from the live site's "ACROSS THE ISLANDS" and "CONNECTING WITH YOU" sections have been incorporated where available. The live site has additional carousel photos that can be downloaded and added to the `img/world/general/` folder as they become available.
