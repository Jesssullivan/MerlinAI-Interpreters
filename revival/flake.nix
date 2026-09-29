# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Jess Sullivan (revival-2026 glue; see ../NOTICE)
{
  description = "MerlinAI-Interpreters revival-2026: the 2021 Flask interpreter on loopback, TensorFlow-free, with a 2026 reconstruction model";

  # Same nixpkgs as xoruby-2026's flake.lock, so onnxruntime/numpy come from the same store paths.
  inputs.nixpkgs.url = "github:NixOS/nixpkgs/1c3fe55ad329cbcb28471bb30f05c9827f724c76";

  outputs = { self, nixpkgs }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      forAll = f: nixpkgs.lib.genAttrs systems (system: f nixpkgs.legacyPackages.${system});
      python = pkgs: pkgs.python3.withPackages (ps: [
        ps.flask ps.flask-cors ps.waitress ps.pydub ps.pytz ps.numpy ps.onnxruntime
      ]);
      runtime = pkgs: [ (python pkgs) pkgs.ffmpeg-headless pkgs.coreutils pkgs.gnugrep pkgs.curl ];
      app = pkgs: name: script: extra: pkgs.writeShellApplication {
        inherit name;
        runtimeInputs = runtime pkgs ++ extra;
        text = builtins.readFile script;
      };
    in {
      packages = forAll (pkgs: rec {
        serve = app pkgs "interpreter-revival-serve" ./serve.sh [ ];
        check = app pkgs "interpreter-revival-check" ./check.sh [ ];
        parity = app pkgs "interpreter-revival-parity" ./parity.sh [ serve ];
        default = serve;
      });
      apps = forAll (pkgs: {
        default = { type = "app"; program = "${self.packages.${pkgs.system}.serve}/bin/interpreter-revival-serve"; };
        serve = { type = "app"; program = "${self.packages.${pkgs.system}.serve}/bin/interpreter-revival-serve"; };
        check = { type = "app"; program = "${self.packages.${pkgs.system}.check}/bin/interpreter-revival-check"; };
        parity = { type = "app"; program = "${self.packages.${pkgs.system}.parity}/bin/interpreter-revival-parity"; };
      });
      devShells = forAll (pkgs: {
        default = pkgs.mkShell { packages = runtime pkgs; PYTHONDONTWRITEBYTECODE = "1"; };
      });
    };
}
