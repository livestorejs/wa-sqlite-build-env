{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/release-25.05";
    nixpkgsUnstable.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    # Enable submodules for this flake
    self.submodules = true;
  };

  outputs = { self, nixpkgs, nixpkgsUnstable, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
        # pkgsUnstable is currently needed to get a recent emscripten version (2025-02-20-14:45)
        # TODO remove this once emscripten 3.1.73 is available in nixpkgs
        pkgsUnstable = import nixpkgsUnstable { inherit system; };
        corepack = pkgs.runCommand "corepack-enable" {} ''
          mkdir -p $out/bin
          ${pkgs.nodejs_24}/bin/corepack enable --install-directory $out/bin
        '';
      in
      {
        packages = {
          # Build using submodules automatically pulled by Nix
          wa-sqlite-livestore = pkgs.callPackage ./nix/wa-sqlite-livestore.nix { 
            inherit pkgsUnstable; 
            waSQLiteSrc = "${self}/wa-sqlite";
          };
          
          # wa-sqlite-livestore-esm = pkgs.callPackage ./packages/sqlite/nix/default.nix {
          #   wa-sqlite-livestore = self.packages.${system}.wa-sqlite-livestore;
          # };
          # althttpd = pkgs.callPackage ./nix/althttpd.nix { };
        };

        # Explicit apps for wa-sqlite management
        apps = {
          build-wa-sqlite = {
            type = "app";
            program = toString (pkgs.writeShellScript "build-wa-sqlite" ''
              set -euo pipefail
              
              echo "Building wa-sqlite..."
              
              # Initialize submodule if needed (first time setup)
              if [ ! -f wa-sqlite/package.json ]; then
                echo "First time setup: initializing wa-sqlite submodule..."
                git submodule update --init --recursive
              fi

              pkg=$(nix build --no-link --print-out-paths .#wa-sqlite-livestore)
              
              # Setup/update dist directory
              mkdir -p wa-sqlite
              rm -rf wa-sqlite/dist
              echo "Copying built package from $pkg..."
              cp -rf "$pkg/dist" wa-sqlite/dist
              chmod -R u+w wa-sqlite/dist
              echo "✓ wa-sqlite build complete"
            '');
          };
        };

        # Clean devShell without problematic interpolations
        devShell = with pkgs; pkgs.mkShell {
          buildInputs = [
            # self.packages.${system}.althttpd # need newer version with `--enable-sab` flag

            nodejs_24
            corepack
            bun
          ];

          # Can also be run explicitly via `nix develop --print-build-logs` to see full logs
          shellHook = ''
            echo "=== wa-sqlite development environment ==="
            echo ""
            echo "Available commands:"
            echo "  nix run .#build-wa-sqlite    - Build wa-sqlite"
          '';

        };


      });
}
