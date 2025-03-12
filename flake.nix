with import <nixpkgs> {};

stdenv.mkDerivation {
    name = "node";
    buildInputs = [
        nodejs
    ];
    shellHook = ''
        clear
        export PS1='\[\e[38;5;48;3m\]nix-shell\[\e[0m\]: \W \$> '
    '';
}
