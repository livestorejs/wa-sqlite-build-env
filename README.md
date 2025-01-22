# wa-sqlite-build-env

Build environment for [livestorejs/wa-sqlite](https://github.com/livestorejs/wa-sqlite). 

## Build

```sh
rm -rf wa-sqlite/dist
nix develop '.?submodules=1' --print-build-logs     
```

NOTE: `.?submodules=1` is required since `wa-sqlite` is a submodule.
