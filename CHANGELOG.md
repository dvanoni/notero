# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.2.1](https://github.com/dvanoni/notero/compare/v0.2.0...v0.2.1) (2021-12-31)


### Features

* Sync editors separately from authors ([f3d9bf3](https://github.com/dvanoni/notero/commit/f3d9bf34157c5ef203190a9a70af5d441f82a2f1))
* Sync file path of best attachment to Notion ([8e15d25](https://github.com/dvanoni/notero/commit/8e15d25883b234c092988cd5b657127f3a0dc80f))
* Sync Zotero tags to Notion ([3c9b72d](https://github.com/dvanoni/notero/commit/3c9b72d89f5bad3f45157bd3599de3f93de3eb84))


### Bug Fixes

* Correctly format author names that don't have separate first/last ([c6722ae](https://github.com/dvanoni/notero/commit/c6722ae2a07cedfe19e830a9404ad9dc78612402))
* Create new Notion page if previous page is not found ([0028d88](https://github.com/dvanoni/notero/commit/0028d884326b9c065aba2d3a3c13dcb8f4fbe9f1))
* Ensure item is regular item before syncing ([7c4f703](https://github.com/dvanoni/notero/commit/7c4f7038677980fe465ee51c76e4ccc419175af0))

## [0.2.0](https://github.com/dvanoni/notero/compare/v0.1.3...v0.2.0) (2021-12-28)


### Features

* Add option to sync items when modified ([8eac0d8](https://github.com/dvanoni/notero/commit/8eac0d8c33ba6b7a7bce8bec55f928b81a88964c))
* Only save a single Notion link attachment to each item ([ca556b4](https://github.com/dvanoni/notero/commit/ca556b4103ecca3cbd02a14ba81eb13ec1f13d0c))
* Update existing Notion pages instead of creating duplicate pages ([f45ee94](https://github.com/dvanoni/notero/commit/f45ee94d905dc2267e331bbde4b574ae88a775b9))

### [0.1.3](https://github.com/dvanoni/notero/compare/v0.1.2...v0.1.3) (2021-12-27)


### Features

* Only save properties that actually exist in the database ([1cd3c59](https://github.com/dvanoni/notero/commit/1cd3c5922fca624115f3dcc2996558280d79e94e))


### Bug Fixes

* Ensure errors are logged regardless of if they have a stack ([121e6dd](https://github.com/dvanoni/notero/commit/121e6dd133488cf9c79b552dfc42d41501ce8462))
