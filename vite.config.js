import { defineConfig } from 'vite';

// On GitHub Actions, GITHUB_REPOSITORY is "owner/repo" — use the repo name as the
// base path so asset URLs resolve correctly on a project Pages site (username.github.io/repo/).
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS && repoName ? `/${repoName}/` : '/';

export default defineConfig({
  base,
});
