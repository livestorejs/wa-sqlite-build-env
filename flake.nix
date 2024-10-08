{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-24.05";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        corepack = pkgs.runCommand "corepack-enable" {} ''
          mkdir -p $out/bin
          ${pkgs.nodejs_22}/bin/corepack enable --install-directory $out/bin
        '';
      in
      {
        packages = {
          wa-sqlite-livestore = pkgs.callPackage ./nix/wa-sqlite-livestore.nix { };
          # wa-sqlite-livestore-esm = pkgs.callPackage ./packages/sqlite/nix/default.nix {
          #   wa-sqlite-livestore = self.packages.${system}.wa-sqlite-livestore;
          # };
          # althttpd = pkgs.callPackage ./nix/althttpd.nix { };
        };

        devShell = with pkgs; pkgs.mkShell {
          buildInputs = [
            # self.packages.${system}.althttpd # need newer version with `--enable-sab` flag

            nodejs_22
            corepack
            bun
          ];

          # Can also be run explicitly via `nix develop --print-build-logs` to see full logs
          shellHook = ''
            rm -rf wa-sqlite/dist
            echo ${self.packages.${system}.wa-sqlite-livestore}
            cp -rf ${self.packages.${system}.wa-sqlite-livestore}/dist wa-sqlite/dist
            chmod -R u+w wa-sqlite/dist
          '';

        };


      });
}
