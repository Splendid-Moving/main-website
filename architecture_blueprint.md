# Frontend Architecture Blueprint

Use this blueprint to ensure every standalone frontend project is predictable, organized, and easy to maintain.

## 📁 1. Project Folder Structure
Keep the root directory clean. Only HTML files should live there for easy hosting and navigation.

- `/` (Root)
    - `index.html` (Homepage)
    - `service-page.html` (Other pages)
    - `/assets` (All supporting files)
        - `/assets/css` (Stylesheets)
        - `/assets/js` (Scripts)
        - `/assets/images` (Logos, icons, photos)
    - `/docs` (Documentation, notes, data)

---

## 🧱 2. Code Naming Conventions (BEM)
Use **Block-Element-Modifier (BEM)** to keep CSS readable. This tells you exactly what an element is and where it belongs.

- **Block**: The standalone parent component.
    - `.card`, `.nav`, `.footer`
- **Element**: A nested part of a block. Use `__` (double underscore).
    - `.card__title`, `.nav__link`, `.footer__logo`
- **Modifier**: A variation or state. Use `--` (double dash).
    - `.btn--primary`, `.card--highlighted`, `.nav__link--active`

---

## 🏗️ 3. Predictable HTML Patterns
Every page should be built using standardized, clearly labeled sections:

1.  **Header**: Branding and simple navigation.
2.  **Hero**: One big idea + one major call to action (CTA).
3.  **Features/Services**: A grid or list showing what you do.
4.  **Proof**: Testimonials, trust badges, or "As seen in" logos.
5.  **Process**: (Optional) 1-2-3 steps on how it works.
6.  **Action CTA**: A final section focused solely on the user taking one action.
7.  **Footer**: Fine print, social links, and the secondary navigation.

---

## ⚡ 4. The "Vanilla First" Philosophy
- **Performance**: Zero dependencies unless necessary.
- **Speed**: Perfect PageSpeed scores (95+).
- **SEO**: Use semantic HTML tag names (`<section>`, `<article>`, `<header>`) instead of just `<div>`.
- **Sustainability**: Write code that will work in 10 years without updates.
