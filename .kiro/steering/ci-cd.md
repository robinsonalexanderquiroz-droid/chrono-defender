---
inclusion: always
---

# Chrono Defender – CI / CD

## Workflow Files

- All workflow files live under `.github/workflows/`.
- Two workflows are required: `ci.yml` (quality gate) and `deploy.yml` (production deployment).
- Workflow files must not be created until their dedicated approved task begins.
- Do not create placeholder or stub workflow files during scaffolding.

## CI Workflow (`ci.yml`)

### Triggers

- Runs on every pull request targeting `main`.
- Runs on every push to `main`.
- Pull requests must never trigger deployment.

### Permissions

- The CI workflow must declare `permissions: read-all` (or equivalent per-job read-only grants).
- No write permissions are granted to the CI workflow.

### Node Version

- CI must use Node 20 (matching `.nvmrc` and `package.json` engines).
- Pin the exact minor/patch via the `node-version` input of `actions/setup-node` to ensure reproducibility; update intentionally.

### Required Steps (in order)

1. `npm ci` — reproducible install.
2. `npm run typecheck` — TypeScript type-check (`tsc --noEmit`).
3. `npm run lint` — ESLint with zero errors required.
4. `npm run format:check` — Prettier check.
5. `npm run test` — Vitest unit tests (`vitest --run`).
6. `npm run build` — production Vite build.
7. `npm run test:e2e` — Playwright E2E tests against `vite preview`.
8. `npm audit --audit-level=high` — security audit; high/critical findings fail the build.

### Caching

- Cache the npm dependency directory (`~/.npm`) keyed on `package-lock.json` hash to speed up repeated runs.

## Deployment Workflow (`deploy.yml`)

### Triggers

- Runs only on push to `main` **after** required CI checks pass.
- Must never run on pull requests or any branch other than `main`.
- Uses a `workflow_run` trigger or branch protection rules to enforce CI-first ordering.

### Permissions

The deployment job requires only:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

No other permissions are granted.

### Environment

- The deployment job must target the `github-pages` environment.
- Concurrency must be set to allow only one deployment at a time; in-progress deployments are not cancelled (to avoid partial deploys).

### Required Steps

1. `npm ci`
2. `npm run build` — produces `dist/`.
3. `actions/configure-pages` — prepares the Pages upload.
4. `actions/upload-pages-artifact` — uploads `dist/` as the Pages artifact.
5. `actions/deploy-pages` — deploys the uploaded artifact.

### Vite Base Path

- The `base` option in `vite.config.ts` must be set to `"/chrono-defender/"` for all production builds and the deploy workflow.
- This value is derived from the confirmed GitHub repository name `chrono-defender`.

### Secrets

- The deployment workflow requires no runtime secrets beyond the automatic `GITHUB_TOKEN` provided by Actions.
- Do not add any repository secrets for deployment.

### Resolved Deployment Information

| Item | Value |
|---|---|
| GitHub repository owner | `robinsonalexanderquiroz-droid` |
| GitHub repository name | `chrono-defender` |
| GitHub repository URL | `https://github.com/robinsonalexanderquiroz-droid/chrono-defender` |
| GitHub Pages URL | `https://robinsonalexanderquiroz-droid.github.io/chrono-defender/` |
| Vite `base` path | `"/chrono-defender/"` |

### GitHub Actions SHA Pins

All third-party Actions must be referenced by commit SHA, not mutable tag. The following SHAs correspond to the latest releases as of the date these steering documents were last updated. Verify and update intentionally when upgrading.

| Action | Version | Commit SHA |
|---|---|---|
| `actions/checkout` | v7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| `actions/setup-node` | v7.0.0 | `820762786026740c76f36085b0efc47a31fe5020` |
| `actions/configure-pages` | v6.0.0 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| `actions/upload-pages-artifact` | v5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| `actions/deploy-pages` | v5.0.0 | `cd2ce8fcbc39b97be8ca5fce6e763baed58fa128` |

## Branch Protection (Recommended, not automated)

- Require the CI workflow to pass before merging to `main`.
- Require pull request reviews (at least one approval).
- Do not allow direct pushes to `main` except for the initial repository setup commit.

## Security Notes

- `npm audit` runs on every CI execution; do not suppress or bypass it.
- Workflow files must not echo, log, or expose any secret values.
- Do not use `pull_request_target` trigger unless the security implications are fully understood and explicitly approved.
- Pin all third-party Actions to a specific commit SHA (not a mutable tag) to prevent supply-chain attacks; update SHAs intentionally.
