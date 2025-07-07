# Release Process

## Prerequisites
- Clean working directory (`git status` shows only intended changes)

## Steps

1. **Update version**
   ```bash
   cd wa-sqlite
   # Edit package.json version directly or use pnpm
   pnpm version patch  # or minor/major/prepatch/preminor/premajor
   ```

2. **Rebuild with Nix**
   ```bash
   # From repository root
   nix run .#build-wa-sqlite
   ```

3. **Test the build**
   ```bash
   # From repository root
   node -e "import('./wa-sqlite/dist/wa-sqlite.node.mjs').then(m => console.log('✓ Build works'))"
   ```

4. **Update CHANGELOG.md**
   - Add entry for new version with date
   - Document changes

5. **Commit all changes**
   ```bash
   # The wa-sqlite submodule has modified dist files that need to be committed
   git add wa-sqlite nix/wa-sqlite-livestore.nix CHANGELOG.md
   git commit -m "Release wa-sqlite vX.Y.Z"
   ```

6. **Publish to npm**
   ```bash
   cd wa-sqlite
   pnpm publish --access public
   ```

7. **Push changes**
   ```bash
   git push origin main
   ```
