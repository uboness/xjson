# @uboness/xjson

Extended JSON with addition data types

## Initialize this repo

add the following packages:

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
