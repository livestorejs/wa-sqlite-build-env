{
  inputs = {
    nixpkgs.url = "nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        packages = {
          sqlite-wasm = pkgs.callPackage ./nix/sqlite-wasm.nix { };
          sqlite-wasm-esm = pkgs.callPackage ./packages/sqlite/nix/default.nix {
            sqlite-wasm = self.packages.${system}.sqlite-wasm;
          };
          althttpd = pkgs.callPackage ./nix/althttpd.nix { };
        };

        devShell = with pkgs; pkgs.mkShell {
          buildInputs = [
            self.packages.${system}.althttpd # need newer version with `--enable-sab` flag
          ];

          shellHook = ''
            echo ${self.packages.${system}.sqlite-wasm}
            echo ${self.packages.${system}.sqlite-wasm-esm}
            cp -rf ${self.packages.${system}.sqlite-wasm-esm} packages/sqlite/dist
            chmod +w packages/sqlite/dist
          '';

        };


      });
}
