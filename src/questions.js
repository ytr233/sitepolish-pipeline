import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

export function questionSession() {
    return readline.createInterface({ input: stdin, output: stdout });
}

export async function askYesNo(session, message, defaultAnswer = false) {
    const hint = defaultAnswer ? "[Y/n]" : "[y/N]";
    const answer = (await session.question(`${message} ${hint} `))
        .trim()
        .toLowerCase();
    if (!answer) {
        return defaultAnswer;
    }
    return answer === "y" || answer === "yes";
}

export async function askReview(
    session,
    message,
    showDetails,
    recordAlternative,
) {
    while (true) {
        const answer = (await session.question(`${message} [y/n/d/a] `))
            .trim()
            .toLowerCase();

        if (answer === "y" || answer === "yes") {
            return true;
        }
        if (answer === "n" || answer === "no" || answer === "") {
            return false;
        }
        if (answer === "d") {
            showDetails();
            continue;
        }
        if (answer === "a") {
            const alternative = (
                await session.question(
                    "Describe your preferred alternative in plain language: ",
                )
            ).trim();
            if (alternative) {
                recordAlternative?.(alternative);
                console.log(
                    "Alternative recorded. Edit the candidate while the comparison preview is open; its After pane will refresh automatically.",
                );
                return false;
            }
            console.log("No alternative was entered.");
            continue;
        }
        console.log(
            "Enter y to approve, n to skip, d for details, or a for an alternative.",
        );
    }
}
