# setup-fpm

__GitHub Action to setup the [Fortran Package Manager](https://github.com/fortran-lang/fpm) on Ubuntu, MacOS and Windows.__

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![.github/workflows/test-workflow.yml](https://github.com/fortran-lang/setup-fpm/actions/workflows/test-workflow.yml/badge.svg)](https://github.com/fortran-lang/setup-fpm/actions/workflows/test-workflow.yml)

## Usage

```yaml
  - uses: fortran-lang/setup-fpm@v5
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

__`fpm-version`__ (*optional, default:* see below) the tag corresponding to a Github release from which to fetch the `fpm` binary.
  - If set to `'latest'` then the latest `fpm` release at [fortran-lang/fpm](https://github.com/fortran-lang/fpm/releases/latest) will be substituted. `github-token` must be provided if `fpm-version` is `'latest'`.

__`fpm-repository`__ (*optional, default:* `https://github.com/fortran-lang/fpm`) which Github fork to fetch release binaries from.

### Default `fpm-version` for Each Release

Starting with `v7`, `setup-fpm` is pinpointed to `fpm` version `0.11.0` to ensure compatibility with newer features and changes. 
Previous versions default to the latest stable release, which is fetched automatically when `fpm-version` is set to `'latest'`.

| Release Version | Default `fpm-version` |
|-----------------|-----------------------|
| v1              | latest                |
| v2              | latest                |
| v3              | latest                |
| v4              | latest                |
| v5              | latest                |
| v6.0.1          | latest                |
| v6              | latest                |
| v6.1.0          | latest                |
| v7              | 0.11.0                |

