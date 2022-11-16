# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [0.4.0](https://github.com/dvanoni/notero/compare/v0.3.5...v0.4.0) (2022-11-16)


### ⚠ BREAKING CHANGES

* Previously, Notion page titles were generated using an APA in-text
citation which includes parentheses around the author and date. The
new default title format is similar except it omits the parentheses.

### Features

* Add support for Zotero's Short Title field ([#170](https://github.com/dvanoni/notero/issues/170)) ([2736280](https://github.com/dvanoni/notero/commit/2736280e549d10866af7ae3ff00debebefdbed7c))
* Enable customization of field to use as Notion page title ([#101](https://github.com/dvanoni/notero/issues/101)) ([b34119f](https://github.com/dvanoni/notero/commit/b34119fe1dbbefd2056ac49f04d04a8c8b853f11))

### [0.3.5](https://github.com/dvanoni/notero/compare/v0.3.4...v0.3.5) (2022-05-22)


### Features

* Add support for Zotero's Date property ([#77](https://github.com/dvanoni/notero/issues/77)) ([ce404dd](https://github.com/dvanoni/notero/commit/ce404dd7020ef8a386e55c86e84782afb037ce5f))

### [0.3.4](https://github.com/dvanoni/notero/compare/v0.3.3...v0.3.4) (2022-05-10)

### [0.3.3](https://github.com/dvanoni/notero/compare/v0.3.2...v0.3.3) (2022-03-26)


### Features

* Add Simplified Chinese support ([#54](https://github.com/dvanoni/notero/issues/54)) ([efe1f3d](https://github.com/dvanoni/notero/commit/efe1f3de3d54caba46d31f6a8d71363084f144b6))

### [0.3.2](https://github.com/dvanoni/notero/compare/v0.3.1...v0.3.2) (2022-02-07)


### Features

* Support installation in Zotero 6 ([#42](https://github.com/dvanoni/notero/issues/42)) ([ee5f937](https://github.com/dvanoni/notero/commit/ee5f937c71da0095ae1331bf0e6cc1dca0e068dd))

### [0.3.1](https://github.com/dvanoni/notero/compare/v0.3.0...v0.3.1) (2022-01-22)


### Features

* Sync abstracts to Notion ([#35](https://github.com/dvanoni/notero/issues/35)) ([7d2a55f](https://github.com/dvanoni/notero/commit/7d2a55fb195d2c002ac9dbcc85ae5edea651e132))

## [0.3.0](https://github.com/dvanoni/notero/compare/v0.2.2...v0.3.0) (2022-01-21)


### Features

* Allow selection of multiple collections to sync in preferences ([ff847f8](https://github.com/dvanoni/notero/commit/ff847f81c701da929bdea9e78e8a722d5f1fd097))
* Migrate preferences from single collection to multiple ([4b5f36e](https://github.com/dvanoni/notero/commit/4b5f36eda200f7db371f3db7f742522f927010fc))
* Monitor and sync from multiple collections and subcollections ([5baf7ab](https://github.com/dvanoni/notero/commit/5baf7ab30513e84c493bbb6e81076bb5151f12dd))
* Show error messages in progress window instead of alert ([6addf64](https://github.com/dvanoni/notero/commit/6addf6419ba633638e91f3b7a1621474f498fd8a))


### Bug Fixes

* Do not sync items when deleted ([fef2e5e](https://github.com/dvanoni/notero/commit/fef2e5ea387678e23e46544228f2c4c0b8c9da51))
* Ensure Notion select options do not contain commas ([88d07a7](https://github.com/dvanoni/notero/commit/88d07a7f8ebf83ee1521583d65c0ac8a7770d722))
* Prevent extra syncing and duplicates using a debounced queue ([8cb5730](https://github.com/dvanoni/notero/commit/8cb5730707c6932eb2c2af5e12c3f08fe8235091))

### [0.2.2](https://github.com/dvanoni/notero/compare/v0.2.1...v0.2.2) (2022-01-08)


### Features

* Use less obtrusive progress window in bottom corner ([2c6810d](https://github.com/dvanoni/notero/commit/2c6810dd103f2a65856fc72f8ea104b510c950d0))

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
