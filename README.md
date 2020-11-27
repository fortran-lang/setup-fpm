# setup-fpm

__GitHub Action to setup the [Fortran Package Manager](https://github.com/fortran-lang/fpm) on Ubuntu, MacOS and Windows.__

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Github actions](https://github.com/LKedward/setup-fpm/workflows/.github/workflows/test-workflow.yml/badge.svg?event=push)](https://github.com/LKedward/setup-fpm/actions)


## Usage

```yaml
  - uses: lkedward/setup-fpm@v1
```

This will download the latest `fpm` version to the CI machine and add it to the path.

`fpm` can therefore be called from the command line as usual in your workflows:

__e.g.:__
```yaml
  - run: fpm run
```

## Options

__`use-bootstrap`__ (*optional,default:*`false`) whether to fetch and use the legacy 'bootstrap' implementation

__`fpm-version`__ (*optional*) the tag corresponding a Github release from which to fetch the `fpm` binary.
If omitted, the latest `fpm` release at [fortran-lang/fpm](https://github.com/fortran-lang/fpm/releases/latest) will be substituted.

__`fpm-repository`__ (*optional, default:* `https://github.com/fortran-lang/fpm`) which Github fork to fetch release binaries from.
