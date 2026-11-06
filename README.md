# Tastes of Africa

A responsive African culinary discovery website built with **HTML5, CSS3 and vanilla JavaScript** — no frameworks or libraries. The visual design follows the approved Figma design (exported from Figma Make, kept in `African Culinary Discovery Website.zip` for reference).

## Pages

| Page | File |
|---|---|
| Homepage | `index.html` |
| Recipe collection | `recipes/recipes.html` |
| Recipes | `recipes/jollof-rice.html`, `injera.html`, `tagine.html`, `isombe.html`, `bunny-chow.html`, `chapati.html`, `brochettes.html`, `ibishyimbo.html`, `mahindi-choma.html`, `roasted-sweet-potatoes.html` |
| Regions overview | `regions/regions.html` |
| Regions | `regions/west-africa.html`, `east-africa.html`, `north-africa.html`, `southern-africa.html` |
| About Us | `about.html` |
| Contact | `contact.html` |

## Project structure

```
├── index.html, about.html, contact.html
├── recipes/        recipe listing + 6 recipe pages
├── regions/        regions overview + 4 region pages
├── css/style.css   one shared stylesheet (CSS variables, Grid, Flexbox, media queries)
├── js/script.js    one shared script (all interactive features)
└── images/         favicon
```

## JavaScript features

1. **Recipe filtering** – All / West / East / North / Southern Africa buttons using `data-region`, plus live search and a "My favourites" filter.
2. **Favourites** – heart buttons save recipe IDs in `localStorage` (no duplicates), and saved hearts are restored after refreshing.
3. **Contact form validation** – `submit` listener with `event.preventDefault()`; name, email and country are checked, and the message must be more than 20 characters.
4. **Personalised feedback** – after a valid message, the form hides and a thank-you message shows the visitor's name and country.
5. **Ingredient scaler** – changing the servings recalculates every quantity (e.g. 4 → 2 servings: 2 cups → 1 cup).
6. **Dark / light mode** – theme toggle saved in `localStorage` and restored on load.
7. Extras – search overlay, mobile menu, expand/collapse cooking steps and newsletter feedback.

## HTML & accessibility highlights

Semantic landmarks (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`), one `h1` per page, `figure`/`figcaption`, `details`/`summary` cooking steps, `mark` highlights, a `datalist` of country suggestions, labelled form fields, alt text on every image, a skip link, ARIA states on toggles and visible focus styles.

## Media

Every recipe and region page embeds a YouTube tutorial and a Google Map of the dish's home. The homepage embeds a TED talk by chef Dieuveil Malonga.

All videos are embedded with `<iframe>` and play **inside the website**. YouTube blocks embedded videos on pages opened directly as files (`file:///...`, "Error 153"), so view the site through a web address:

- **Live site (GitHub Pages):** Settings → Pages → Source: *Deploy from a branch* → `main` / root → Save. The site appears at `https://<username>.github.io/<repository-name>/`.
- **Locally:** open the folder in VS Code, install the **Live Server** extension, right-click `index.html` → *Open with Live Server*.

## Credits

Food photography from [Unsplash](https://unsplash.com) (as used in the Figma design). Videos belong to their YouTube creators.
