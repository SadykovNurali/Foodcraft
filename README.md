# Food Craft — multi-page responsive website

Healthy sport food for students and active people in Astana: meals with calories and protein, a recipe search (public API), a meal builder, delivery ordering and a simulated account system.

## Pages (10)
| File | Purpose |
|---|---|
| index.html | Home: hero, animated stats, features, popular meals |
| sportfood.html | Nutrition guide + search / filter / sort of meals (state saved in localStorage) |
| recipes.html | Live recipes from TheMealDB API (loading + error states, details modal, favorites) |
| builder.html | Meal builder with live calories / protein / price, saved bowls |
| order.html | Cart + delivery form with validation, order history |
| about.html | Purpose, audience, team (role filter) |
| contact.html | Contact form with validation + FAQ |
| signup.html / login.html / profile.html | Authentication simulation with localStorage |

## Folder structure
```
index.html, about.html, contact.html, ...
css/style.css      one stylesheet, light + dark tokens
js/data.js         static data (meals, ingredients, zones, team)
js/script.js       all logic, commented by section
images/            optimized images
```

## Hosting on GitHub Pages
1. Copy everything from this folder into the repository root (delete the old files first: old `style.css`, `script.js`, `team.html`, `more-recipes.json`, `css/styleD.css`, `sounds/`, unused images).
2. `git add . && git commit -m "Final website" && git push`
3. GitHub → repository → Settings → Pages → Branch `main`, folder `/ (root)` → Save.
4. Submit the live link `https://<user>.github.io/<repo>/` and the repository link.

## Notes
- No date or time is shown anywhere on the site.
- Validation is done only in JavaScript (forms have `novalidate`; no `required`/`pattern`/`minlength`/`type="email"`).
- Passwords are stored as SHA-256 hashes in localStorage (simulation, no backend).
