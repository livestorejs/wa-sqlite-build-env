# wa-sqlite-build-env

Build environment for [livestorejs/wa-sqlite](https://github.com/livestorejs/wa-sqlite). 

## Build

```sh
cp -r wa-sqlite wa-sqlite-local
rm -rf wa-sqlite-local/.git
git add wa-sqlite-local
# update `localWaSqlite` in `nix/wa-sqlite-livestore.nix`
nix develop  --print-build-logs     

# TODO bring this back once Nix-submodule issue is fixed
rm -rf wa-sqlite/dist
nix develop '.?submodules=1' --print-build-logs     
```

NOTE: `.?submodules=1` is required since `wa-sqlite` is a submodule.

## Publish

```sh
cd wa-sqlite
pnpm publish
```
