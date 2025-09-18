# @uboness/[NAME]

[DESCRIPTION] 

## Initialize this repo

add the following packages:

1. Change this README with the new names and descriptions of the library.

2. Run the following commands to add all the dev libs 
```bash
pn add -D typescript @types/node jest @types/jest ts-jest rimraf del-cli commit-and-tag-version
```
When using `.peg` files, also add the `peggy` lib:

```bash
pn add peggy -D
```
(If you don't use `peg` files, make sure to update `package.json` by removing the `build:peg` script and its references)

## Dev

This project will be published with both commonjs and esm codebases

### Bulid Commands

- `pn clean` - deletes the `dist` dir and also deletes all the generated parsers form the codebase


- `pn build`:
  - `build:peg` - generates the parsers 
  - `build:compile` - compiles the code to two flavors - `esm` and `commonjs`
  - `build:preparePackageJsons` - injects `package.json` in both `esm` and `cjs` dist directories just to indicate the module type


- `pn cbuild` - runs `clean` and then `build`

  
- `pn release`:
  - bumps a version
  - updates `CHANGELOG` based on the commit messages
  - pushes to remote repo - including new tags for the new version
  - publishes the project to the NPM repo (github)

### Others Resources
- GitHub as the NPM repository
- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) - for commit messages guidelines
