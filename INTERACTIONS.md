# Rohit Poudel portfolio: what the screenshots can't show

This describes the motion, hover states, sound and behaviour of the site, section by section. Screenshots are attached separately.

## Overall

- **Stack:** plain HTML, CSS and JavaScript built with Vite. GSAP for animation, Lenis for smooth scrolling, three.js (WebGL) for the 3D hero. No framework.
- **Palette:** cream `#EEECE5`, near-black `#111111`, electric lime `#D4FF35`. Square corners and 1.5px black outlines everywhere.
- **Fonts:** Geist for text, Geist Mono for small labels and buttons, Anek Devanagari for Nepali words.
- **Scrolling:** smooth, slightly eased scrolling (Lenis).
- **Section entrances:** each big heading rises line by line out of a mask as it scrolls into view. Smaller items fade in and rise 24px once, in a short stagger. Nothing re-animates on the way back up.
- **Reduced motion:** with "reduce motion" on in the system settings, the intro, smooth scroll, 3D gallery and all entrance animations are switched off. The hero becomes a flat row of covers and all text is fully visible.

## 1. Intro (first visit only)

Plays once per browser session and lasts about 3 seconds. It is skipped entirely for reduced-motion users and for visitors arriving on a shared case-study link.

1. A plain cream screen. Small labels fade in at the top corners: "Portfolio" and "Kathmandu, 2026".
2. "Rohit Poudel" rises letter by letter out of a mask, each letter slightly after the last.
3. A thick lime rule with a black outline draws across under the name, left to right.
4. A tagline rises in below: "Software and intelligent systems for problems that exist outside the screen."
5. After a short hold, the letters slide up and out, and the rule retracts to the right.
6. A full-screen lime panel sweeps up from the bottom, then the whole intro lifts off the top. Behind it, the hero's 3D ring is already spinning into place.

A "Skip intro" button sits bottom right; Escape, Enter or Space also skip it.

## 2. Navigation bar

- **Layout:** fixed at the top. Logo on the left (a small lime square plus "Rohit Poudel"). On the right, the links Work, Results, About and Contact sit together as one strip of joined boxed buttons, followed by the sound button.
- **Hover:** a link fills black with cream text.
- **Active section:** while you scroll, the link for the section on screen fills lime.
- **Logo:** hovering turns the lime square 90 degrees.
- **Scroll behaviour:**
  - The bar slides away when you scroll down past half a screen and comes back as soon as you scroll up.
  - Over the hero it is transparent. After the hero it gets a solid cream background with a black line under it.
- **Phone:** the links collapse into a "Menu" button that wipes down a full-screen lime panel with the links in very large type.

## 3. Sound

- **Default:** off. Nothing plays until the visitor turns it on.
- **Control:**
  - A boxed "Sound off" button in the bar with four tiny bars. When sound is on, the bars move like a small equaliser and the label reads "Sound on".
  - Clicking it opens a small panel with a hard black drop shadow, containing a Sound switch, an Ambient switch (square toggles that turn lime when on) and a volume slider.
  - The panel closes on Escape or a click outside.
- **Memory:** the choice is saved in the browser. A returning visitor who had sound on gets it back on their first click or key press, never automatically on load.
- **How it is made:** everything is synthesised live in the browser (Web Audio API); there are no audio files. Every sound is a soft bell tone in D major pentatonic, passed through a long, dark reverb and a gentle filter, so any two sounds always fit together. There is no noise or harsh clicking.
- **Ambient:** a very quiet low drone (D and A) that slowly opens and closes like breathing, plus a single soft chime every 3 to 6 seconds, like wind chimes in another room. It fades in over about 5 seconds.
- **Interface cues:**

  | Action | Sound |
  | --- | --- |
  | Pointer moves onto a link, button, tile or ticker item | A very quiet high note from the scale. Moving across the nav plays a gentle run of chimes. Limited to one every 140ms. |
  | Clicking any link or button | One soft note |
  | Turning sound on | Two notes, A then D |
  | Opening a case study | A short rising four-note arpeggio |
  | Closing a case study | The same arpeggio falling |
  | Copying the email address | Two rising notes |
  | Turning a new card toward the pointer in the 3D hero | The hover note |

- **Lifecycle:** sound fades out and pauses when the tab is hidden, and fades back in on return.

## 4. Cursor

- **Normal cursor:** kept everywhere.
- **Label:** over the 3D gallery and the work strips, a small lime label in mono type follows the pointer with a slight lag and says what a press will do:
  - "Drag" on empty gallery space.
  - "View" when over a card.
  - "Open" over a closed work strip.
  - "Read case study" over an open one.
- **Press:** the label shrinks slightly and turns black.
- **Touch devices:** no custom cursor.

## 5. Hero (the 3D gallery)

A real 3D WebGL scene, not CSS.

- **Layout:** fourteen cards (the seven project covers, each twice) stand on a ring around the name "Rohit Poudel". The ring is tilted so its front dips toward the viewer. Because the name is placed in the middle of the ring, cards at the back pass behind the letters and cards at the front pass in front of them.
- **Entrance:** as the intro lifts, the ring spins in from about a third of a turn away and grows from 55% to full size over about 2.5 seconds, and the name fades in.
- **Idle:**
  - The ring drifts slowly on its own.
  - Each card bobs very slightly up and down, out of sync with the others.
  - Cards turned away from the viewer fall into shade, and cards further back fade toward the cream background, for depth.
  - A soft shadow sits on the floor under the ring.
- **Drag:** drag left or right to spin the ring. It keeps spinning with momentum after you let go and slows down naturally.
- **Speed effects:** the faster it spins, the more the cards curve, and a subtle red-green-blue colour split appears on them. Both settle when it slows down.
- **Scroll:** scrolling gives the ring a push in the scroll direction. As you scroll out of the hero, the ring tips back and grows.
- **Pointer:** the whole ring leans slightly toward the pointer (kept subtle on purpose).
- **Hovering a card:** the card grows about 9%, rises a little, brightens, flattens its curve, and the cursor label reads "View".
- **Clicking a card** (without dragging) opens that project's case study.
- **Bottom of the screen:** a small label "Software developer · AI/ML engineer · Kathmandu" and a one-line statement on the left. On the right, a drag hint: a small track with a lime square sliding back and forth, plus "Drag to turn. Click a cover to read it." The hint fades away after the first drag.
- **Accessibility:** the 3D canvas is decorative to screen readers. Real buttons for each project stay in the page for keyboard users, and if WebGL is unavailable they show as a flat row of covers.

## 6. Selected work

- **Desktop layout:** seven tall vertical strips side by side, one per project. One strip is always open.
- **Closed strip:**
  - Shows a narrow slice of its cover.
  - A cream label runs up the left side with the number and project name.
  - On hover, the image zooms in slightly and the label turns lime.
- **Opening:** hovering or keyboard-focusing a strip opens it. The open strip widens smoothly (about 0.85s) while the others narrow. Its cover slides from a centred crop to a full-height image on the left, and an information panel slides in from the right with:
  - Two tags: availability ("Not public yet", "Code on GitHub" or "Live") in black, and the project type in outline.
  - The project name.
  - The problem it solves, in one or two sentences.
  - "Built with" and "Outcome" rows.
  - A "Read the case study" button.
- **Clicking:** a closed strip opens it; an open strip opens its case study. On touch screens the first tap opens the strip and the second opens the case study.
- **Entrance:** the strips rise in one after another as the section scrolls into view.
- **Phone:** becomes an accordion. Every row shows its number and name; the open one shows its cover and all of the information above.

## 7. Case study (overlay)

- **Opening:**
  - Expands as a circle growing out of the exact point you clicked, covering the screen in about a second.
  - The rising arpeggio plays if sound is on.
  - The URL changes to a shareable address such as `/#case-quake`.
- **Layout:**
  - **Left:** a lime panel with the cover tilted about 3 degrees and a hard black offset shadow. The cover settles in by zooming from 122% to 100% while rotating into place.
  - **Right:** a scrollable column. The rows stagger in from below: case-study number, close button, project name, one-line description, tags, then:
    - The name: the meaning of the Nepali name, where there is one.
    - Problem.
    - Approach.
    - How it flows: a small diagram of boxes joined by lines showing the steps the system runs through, with the final step in lime.
    - Outcome, set large.
    - Built with: outlined tags.
    - Links (for example "Code on GitHub" or "Open the site").
    - A screenshot, for the live NepalPrep site.
- **Bottom:** a full-width black "Next case study" block with the next project's name in large type. On hover it turns lime and the name slides right.
- **Controls:**
  - Close button, Escape, or the browser back button closes it, shrinking the circle back.
  - Left and right arrow keys move between projects; the content swaps with a quick fade up and out, then back in.
  - Keyboard focus stays inside the overlay while it is open.
  - A shared link opens straight into that case study.

## 8. Judged, and placed (results)

- **Layout:** a full-width lime section with six cream tiles in a grid.
- **Each tile:**
  - A small type label: "Award", "Finalist", "Runner-up" or "Selection, upcoming".
  - A year where known.
  - A very large word ("1st", "Top 3", "2nd", "Best", "Pitch").
  - What it was, and where.
- **Hover or keyboard focus:**
  - The tile turns black.
  - The big word turns lime and slides 10px right.
  - A hidden note expands underneath in mono type, for example "A finalist place, not a win." or "Chosen to pitch an AI idea. It has not happened yet."
- **The upcoming pitch** is drawn as outline-only lettering, so it never reads as a win.
- **Phone:** the notes are always visible, since there is no hover.

## 9. About

- **Statement:** a large paragraph whose words start very faint (about 16% opacity) and darken one by one as you scroll down through it, tied directly to scroll position.
- **Facts column:** Based in, Studying, Also, and a live Kathmandu clock that ticks every second.
- **Skills:** three columns (Engineering, AI and machine learning, Data and infrastructure), each a short sentence rather than a list of tags.
- **"Everything else on the shelf":** two full-width rows of other projects, each name preceded by a small lime square, with thin black lines above and below.
  - The rows scroll sideways continuously in opposite directions and speed up while you scroll the page.
  - Hovering or focusing a row pauses it. Hovering a name underlines it.
  - Each item links to its GitHub repository or live site in a new tab.

## 10. Contact and footer

- **Background:** near-black, the only dark section.
- **Heading:** "Have a problem worth solving?" rises in line by line.
- **Email address:**
  - Shown very large in lime with a lime underline.
  - On hover, the underline grows into a full lime block behind the text and the text turns black.
  - Clicking copies the address. The small label underneath changes from "Click to copy" to "Copied. Paste it anywhere." for about 2.5 seconds, with the two-note sound if sound is on.
  - If the browser blocks copying, it opens the mail app instead.
- **Buttons:**
  - "Write an email" (lime) opens the mail app.
  - "GitHub" (outlined) opens the GitHub profile.
  - Both are magnetic: they lean toward the pointer when it is near, and spring back with a small elastic wobble.
- **Footer:** copyright with the name in Nepali, location, and "Back to top" with an underline that draws in on hover.

## Buttons and links in general

- Square-cornered, with mono type.
- **Hover:** solid buttons fill lime; outline buttons fill black.
- **Press:** a slight shrink to 97%.
- **Focus:** a visible 2px outline.
- **Text links:** an underline draws in from the left on hover and retracts to the right.

## Known gaps

- No LinkedIn link yet.
- Rohit's personal role on each project is not filled in yet.
- Years are shown only where verified: IdeaX 2026, CivicCode 2026, Startup Summit December 2026.
- Not deployed yet; it runs locally.
