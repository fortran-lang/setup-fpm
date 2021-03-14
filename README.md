# setup-fpm

__GitHub Action to setup the [Fortran Package Manager](https://github.com/fortran-lang/fpm) on Ubuntu, MacOS and Windows.__

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Github actions](https://github.com/fortran-lang/setup-fpm/workflows/.github/workflows/test-workflow.yml/badge.svg?event=push)](https://github.com/fortran-lang/setup-fpm/actions)


## Usage

```yaml
  - uses: fortran-lang/setup-fpm@v3
    with:
      github-token: ${{ secrets.GITHUB_TOKEN }}
```

This will download the latest `fpm` version to the CI machine and add it to the path.

`fpm` can therefore be called from the command line as usual in your workflows:

__e.g.:__
```yaml
  - run: fpm run
```

## Options

__`github-token`__ (*only needed if `fpm-version` is `'latest'` or not specified*), an access token used to query the latest version of `fpm`. Set to `${{ secrets.GITHUB_TOKEN }}` to use the existing github actions token.

__`fpm-version`__ (*optional,default:*`'latest'`) the tag corresponding a Github release from which to fetch the `fpm` binary.
  - If set to `'latest'` (_default_) then the latest `fpm` release at [fortran-lang/fpm](https://github.com/fortran-lang/fpm/releases/latest) will be substituted. `github-token` must be provided if `fpm-version` is `'latest'`.

__`use-haskell`__ (*optional,default:*`false`) whether to fetch and use the legacy Haskell implementation

__`fpm-repository`__ (*optional, default:* `https://github.com/fortran-lang/fpm`) which Github fork to fetch release binaries from.
