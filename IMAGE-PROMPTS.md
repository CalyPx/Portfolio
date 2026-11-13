# Image prompts for the project covers

Seven images, one per project. They must look like one series, so every prompt starts with the same style block. Generate each one in ChatGPT, save it with the file name shown, and drop it in the `incoming/` folder.

## How to use

1. Paste the **style block** plus one **subject** into ChatGPT as a single prompt.
2. Ask for portrait orientation (4:5 or 2:3). If it gives you a square, say "make it portrait, 4:5".
3. Save the image into `incoming/` with the exact file name (for example `incoming/crash.png`). `.png`, `.jpg` and `.webp` all work.
4. With the dev server running (`pnpm dev`), run `pnpm covers`. The site adds the number, category and project name on top of your image and updates every place the cover appears.

You can do one image at a time. Any project without an image keeps its current drawn cover.

## Style block (paste this first, every time)

> High-end 3D render, editorial still life, like a cover for a design magazine. One single hero object, centred slightly above the middle of the frame, floating or resting on a seamless studio backdrop. Strict three-colour palette only: deep matte black, warm off-white (#efede6) and acid lime green (#d7ff3e). No other colours at all. Materials: soft matte clay and satin plastic with one glossy accent. Soft studio lighting from the upper left, gentle contact shadow, subtle film grain. Clean, minimal, lots of empty space. Keep the bottom third of the image calm and uncluttered, because a title will be placed there. Portrait orientation, 4:5. Absolutely no text, no letters, no numbers, no logos, no watermarks, no people, no hands.

## Subjects (add one after the style block)

| File name | Project | Subject to paste |
| --- | --- | --- |
| `crash.png` | Crash Capsule | Backdrop: acid lime. A large pill-shaped capsule, half matte black and half off-white, tilted at 30 degrees, with a small smartphone sealed inside the clear middle band. Thin black concentric shockwave rings radiate from behind it, as if frozen at the moment of impact. |
| `mul.png` | Mul | Backdrop: deep matte black. A single glossy acid-lime water droplet hanging just above a perfectly still black pool, with crisp off-white concentric ripples spreading across the surface below it. Calm, quiet, precise. |
| `sunuwa.png` | Sunuwa | Backdrop: warm off-white. A chunky matte black megaphone pointing right. Out of it flow small speech-bubble shapes in acid lime that fall and sort themselves into one neat stack on the right. |
| `quake.png` | QuakeSafe | Backdrop: deep matte black. A small tower of four off-white concrete blocks, the top two slid slightly out of line with a fine crack between them. A thin glowing acid-lime ribbon shaped like a seismograph trace passes horizontally behind the tower. |
| `prep.png` | NepalPrep | Backdrop: mid warm grey. Four thick off-white capsule-shaped answer bars stacked vertically like a multiple-choice question, each with a round button on its left. The second bar is matte black and its button glows acid lime. A short black pencil leans against the stack. |
| `learn.png` | LearnScape | Backdrop: warm off-white. A floating cube with one acid-lime face, one black face and one grey face, circled by a thin black orbit ring carrying one small black sphere, like a planet. A faint grid on the floor fades into the distance, suggesting augmented reality. |
| `sajha.png` | SajhaDoctor | Backdrop: deep matte black. A thick, soft-edged off-white medical cross standing upright, with a glossy acid-lime sphere set into its centre. A small off-white map pin stands beside it on the floor. |

## If a result is off

- **Extra colours crept in:** reply "Use only black, off-white #efede6 and acid lime #d7ff3e. Remove every other colour."
- **Text or symbols appeared:** reply "Remove all text, letters and numbers."
- **Bottom is busy:** reply "Move the object up and leave the bottom third empty."
- **Looks cartoonish:** reply "Make it more realistic and premium, like a product photograph, matte materials, soft shadows."

## Optional: a photo of you

The About section has no portrait yet. A real photo works best. Send one and it can be treated in the same black, off-white and lime style.
