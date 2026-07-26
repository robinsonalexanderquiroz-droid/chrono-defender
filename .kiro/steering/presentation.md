---
inclusion: always
---

# Chrono Defender – Presentation and Documentation

## Presentation Video

- Maximum duration: **five minutes**.
- The video must include both a live gameplay demonstration and a walkthrough of selected code, automated tests, and security checks.
- The final presentation script is stored at `docs/presentation-script.md`.
- Create `docs/presentation-script.md` when the project is sufficiently complete to demonstrate; do not create it during scaffolding.
- The video itself is not committed to the repository (binary; too large). Link to it from the README once published.

## README

- The README must be professional and suitable for public viewing.
- Required sections: project description, live demo link, technology stack, local development setup, running tests, build instructions, controls, and license.
- The demo link must be inserted once the GitHub Pages URL is known; use a clear placeholder until then.
- Short code excerpts may be included in the README only when they add clear explanatory value.
- The README must not include: credentials, private URLs, local absolute paths, personal information, environment variable values, or invented repository URLs.

## Code Snippets

- A separate `SNIPPETS.md` file is not required for the MVP.
- Code shown publicly (in the README, video, or any other public-facing document) must contain no credentials, private URLs, local absolute paths, personal information, or environment values.
- Snippets must be representative of real, committed code — do not fabricate or simplify snippets to the point of inaccuracy.

## `docs/` Directory

- `docs/presentation-script.md` is the only file required in `docs/` for the MVP.
- Do not create additional files in `docs/` unless explicitly requested.

## License

- The project must include a `LICENSE` file at the repository root.
- Use the MIT License unless a different license is explicitly requested.
- The license must be compatible with all dependencies and any audio assets included.
- Do not commit any asset (code, art, audio, font) whose license is incompatible with public distribution.

## Public Distribution Rules

The following must never appear anywhere in the public repository, build output, README, or presentation materials:

- API keys, tokens, passwords, or any form of credentials
- Private or internal URLs (e.g. internal dashboards, staging environments)
- Local absolute file paths (e.g. `/Users/yourname/...`)
- Personal information (real names, email addresses, phone numbers) unless the owner has explicitly consented to public display
- Environment variable values
- Invented or placeholder repository owner names or URLs (use a documented placeholder token such as `YOUR_GITHUB_USERNAME` instead)
