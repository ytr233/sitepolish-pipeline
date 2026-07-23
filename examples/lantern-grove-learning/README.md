# Lantern Grove Home Learning — fictional example

Lantern Grove Home Learning is an invented homeschooling resource used only to
demonstrate SitePolish. Its names, text, code, and visual treatment are not
copied from a real family, school, or private project.

## Folders

- `input/` is the deliberately imperfect drop-in site.
- `finished/` is the reviewed reference.

## Demonstration

```bash
npm install
npm run example
```

SitePolish copies `input/` into a generated run and reports findings such as:

- missing document language;
- repeated `id` values;
- invalid nesting;
- an invalid `href` on a button;
- an invalid CSS color;
- an unknown JavaScript name.

The finished reference demonstrates human-reviewed decisions:

- semantic header, navigation, main, sections, and footer;
- a link styled as a button for navigation;
- unique classes instead of duplicated identifiers;
- valid CSS with clear focus styles;
- beginner-readable JavaScript using `addEventListener`;
- a demonstration message that does not claim to save data.

The reference is evidence of one reasonable resolution, not a promise that
every website should look the same.
