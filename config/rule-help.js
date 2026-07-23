export const ruleHelp = {
    "element-required-attributes":
        "A required HTML attribute is missing from an element.",
    "element-permitted-content":
        "An element contains a child that HTML does not allow there.",
    "element-permitted-parent":
        "An element is nested inside a parent that HTML does not allow.",
    "no-dup-id": "The same HTML id is used more than once on one page.",
    "no-inline-style":
        "Presentation is written inside HTML instead of the stylesheet.",
    "attr-quotes": "An HTML attribute value needs consistent quotation marks.",
    "color-no-invalid-hex":
        "A hexadecimal color contains characters or a length CSS does not recognize.",
    "declaration-block-no-duplicate-properties":
        "The same CSS property appears more than once in one declaration block.",
    "property-no-unknown": "The property name is not part of recognized CSS.",
    "block-no-empty": "A CSS rule exists but contains no declarations.",
    "no-undef": "JavaScript uses a name that has not been declared.",
    "no-unused-vars": "JavaScript declares a name that is never used.",
};

export function officialDocumentation(tool, ruleId) {
    if (tool === "HTML Validate") {
        return `https://html-validate.org/rules/${ruleId}.html`;
    }

    if (tool === "Stylelint") {
        return `https://stylelint.io/user-guide/rules/${ruleId}/`;
    }

    if (tool === "ESLint") {
        return `https://eslint.org/docs/latest/rules/${ruleId}`;
    }

    return "https://prettier.io/docs/cli/";
}
