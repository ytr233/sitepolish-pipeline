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
