{ lib, stdenv, sqlite-wasm, pkgs }:

stdenv.mkDerivation rec {
  pname = "sqlite-wasm-esm";
  version = "3.40.0";

  src = ./..;

  builder = ./builder.sh;

  nativeBuildInputs = [
    pkgs.gnused # use version with support for `sed -i`
  ];

  sqlitelib = "${sqlite-wasm}/ext/wasm/jswasm";

}
