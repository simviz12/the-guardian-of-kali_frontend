# Contributing to The Guardian of Kali — Desktop

To maintain code quality and UI consistency, all contributions must strictly adhere to the following workflow and standards.

## Language Rule
All source code, identifiers, comments, commit messages, pull requests, and documentation must be in **English**.

## Branch Strategy
Direct pushes to `main` are disabled. All work must be conducted in dedicated branches and merged via Pull Requests.

Branch naming standard:
- `feature/<short-name>`: New UI components, terminal features, or state integrations.
- `fix/<short-name>`: Bug fixes, UI glitch patches, or IPC communication corrections.
- `chore/<short-name>`: Tooling, package updates, or bundler configs.
- `test/<short-name>`: Adding or modifying UI/unit tests.
- `docs/<short-name>`: Documentation and style guide updates.

## Conventional Commits
All commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

- `feat:` Adds a new feature or component.
- `fix:` Fixes a bug.
- `test:` Adds or updates tests.
- `docs:` Documentation-only changes.
- `chore:` Changes that do not modify src or test files.
- `refactor:` Code changes that neither fix bugs nor add features.

### Workflow Example:
```bash
git checkout -b feature/xterm-wsl-integration
git add .
git commit -m "feat: integrate xterm terminal component with node-pty"
git push -u origin feature/xterm-wsl-integration
# Open a Pull Request on GitHub to merge into main
```
