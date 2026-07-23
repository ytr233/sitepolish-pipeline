export function readOptions(argumentsList) {
    const options = {};

    for (let index = 0; index < argumentsList.length; index += 1) {
        const item = argumentsList[index];
        if (!item.startsWith("--")) {
            continue;
        }

        const key = item.slice(2);
        const next = argumentsList[index + 1];
        options[key] = next && !next.startsWith("--") ? next : true;
        if (options[key] !== true) {
            index += 1;
        }
    }

    return options;
}
