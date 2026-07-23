# Optional Bootstrap appendix

Bootstrap is a library of prewritten CSS and JavaScript components. It can
accelerate layout work, but it does not replace validation, content decisions,
accessibility review, or a custom visual identity.

SitePolish deliberately keeps Bootstrap outside the required pipeline:

1. preserve and audit the plain site;
2. repair structural findings;
3. verify the plain HTML, CSS, and JavaScript;
4. compare the reviewed result;
5. only then decide whether a framework benefits the project.

If Bootstrap is selected later, treat it as an optional enhancement profile.
Record the version, use the official installation documentation, preserve
semantic headings and labels, and rerun SitePolish after the change.

Official reference: [Bootstrap documentation](https://getbootstrap.com/docs/)
