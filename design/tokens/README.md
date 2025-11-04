````markdown name=design-tokens/README.md
```markdown
# Design Tokens & Themes — MediMindAI

This folder contains the canonical design tokens and theme examples for the MediMindAI product. The goal is to enable:
- runtime theme switching (dark analytics glass, editorial hybrid, material dynamic)
- consistent use of tokens in CSS, Tailwind, and design tooling
- accessible fallbacks (reduced-motion, reduced-transparency)

Files included:
- design-tokens.css — CSS variables + utility component classes
- design-tokens.json — canonical tokens file for tooling & codegen
- tailwind.config.partial.js — sample Tailwind extension to consume CSS variables

Quick use / integration
1. Fonts
   - Install/serve Inter, Merriweather, and JetBrains Mono via Google Fonts or self-host.
   - Ensure font stacks in your app match the tokens.

2. Import CSS
   - Import `design/tokens/design-tokens.css` as an early stylesheet (before component CSS).
   - Example: <link rel="stylesheet" href="/design/tokens/design-tokens.css">

3. Theme switching
   - Apply themes by setting `data-theme="dark-analytics"` (or `editorial-hybrid`, `material-dynamic`) on the highest-level element (html or body).
   - Example: document.documentElement.setAttribute('data-theme','dark-analytics')

4. Tailwind
   - Merge `tailwind.config.partial.js` with your tailwind config to map classes to CSS vars.
   - Use classes like `bg-surface`, `text-text`, `text-muted`, `text-chart1`, etc.

5. Chart libraries
   - Pull CSS var values in JS for chart palettes: `getComputedStyle(document.documentElement).getPropertyValue('--chart-1')`
   - Chart libraries can be fed arrays [chart-1, chart-2, chart-3] for consistent color usage.

Accessibility notes
- We respect `prefers-reduced-motion` and `prefers-reduced-transparency`. If your app has custom motion toggles, reconcile them with the user's OS settings.
- For users or contexts that require strict contrast, use the `material-dynamic` or editorial themes and increase text weights/sizes accordingly.

Developer workflow suggestions
- Add this folder to Storybook and create a small theme playground story where product people can switch `data-theme` and test combinations (glass + analytics charts, editorial reader + chat).
- Use `design-tokens.json` as the single source of truth for generating other token outputs (Figma tokens plugin, tokens -> platform-specific files).

Next steps I can take for you (pick one):
- Generate a branch with these files added and open a PR containing a short changelog + how to test.
- Produce a Storybook theme playground with a few sample components (glass card, analytics panel, editorial reader, chat composer).
- Export these tokens into platform-specific formats (less, scss, Android XML, iOS .plist).

Which step should I run next?
```
````