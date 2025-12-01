# binary2npm

> Available `posix shell` version of this tool
> [binary2sh](https://github.com/dalisoft/binary2sh)

Prepare execution script for linking binaries from other tools/languages

Currently supports only **GitHub API**

## Installation

```sh
npm install dalisoft/binary2npm
# or
yarn install dalisoft/binary2npm
# or
bun add dalisoft/binary2npm
```

## Environment variables

| Name           | Description                                                                                     | Required |
| -------------- | ----------------------------------------------------------------------------------------------- | -------- |
| `GITHUB_TOKEN` | For [GitHub API](https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting) | Yes      |

## Usage

See [example](./examples/commitlint.js)

```ts
// postinstall.js
import { prepare } from "binary2npm";

await prepare({
  remote: "github",
  author: "MyGitHubUser",
  repository: "my-repo",
  remoteToken: process.env.GITHUB_TOKEN, // To avoid Github API limiting
  binary: "my-binary",
});
```

then add `postinstall.js` as hook into your projects scripts, see how it's implemented in [Used for CLIs](#used-for-clis)

## Used for CLIs

This project was made for first entry but then improved and added support for other ways as well as **Windows** support added

- [commitlint-rs-npm](https://github.com/dalisoft/commitlint-rs-npm)
- [commitlint-go-npm](https://github.com/dalisoft/commitlint-go-npm)
- [jsona-rs-npm](https://github.com/dalisoft/jsona-rs-npm)
- [typos-rs-npm](https://github.com/dalisoft/typos-rs-npm)
- [dprint-rs-npm](https://github.com/dalisoft/dprint-rs-npm)
- [biome-rs-npm](https://github.com/dalisoft/biome-rs-npm)
- [oxlint-rs-npm](https://github.com/dalisoft/oxlint-rs-npm)
- [lefthook-go-npm](https://github.com/dalisoft/lefthook-go-npm)
- [ls-lint-go-npm](https://github.com/dalisoft/ls-lint-go-npm)

## Performance differences

Using direct binary for `npm` can boost performance up-to 8 times.
These CLI apps are blazing fast but `Node.js` `bin.js` causing it to be slow.

| Name                | Performance boost     | PR                                                                                                   |
| ------------------- | --------------------- | ---------------------------------------------------------------------------------------------------- |
| `commitlint-rs-npm` | **No official `npm`** |                                                                                                      |
| `commitlint-go-npm` | **No official `npm`** |                                                                                                      |
| `jsona-rs-npm`      | **No official `npm`** |                                                                                                      |
| `typos-rs-npm`      | **No official `npm`** |                                                                                                      |
| `dprint-rs-npm`     | up to 5 times         | [#839](https://github.com/dprint/dprint/pull/839), [#840](https://github.com/dprint/dprint/pull/839) |
| `biome-rs-npm`      | up to 8 times         | [#2359](https://github.com/biomejs/biome/pull/2359)                                                  |
| `oxlint-rs-npm`     | up to 8 times         | [#2920](https://github.com/oxc-project/oxc/pull/2920)                                                |
| `lefthook-go-npm`   | up to 33%             | [#705](https://github.com/evilmartians/lefthook/pull/705)                                            |
| `ls-lint-go-npm`    | up to 16 times        |                                                                                                      |

## License

Apache-2.0
