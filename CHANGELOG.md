# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.5.3](https://github.com/dvanoni/notero/compare/v0.5.2...v0.5.3) (2023-12-23)


### Features

* Add an icon! ([#405](https://github.com/dvanoni/notero/issues/405)) ([85700b2](https://github.com/dvanoni/notero/commit/85700b2d279e231bce497f5bba56803be48d2a89))

### [0.5.2](https://github.com/dvanoni/notero/compare/v0.5.1...v0.5.2) (2023-12-18)


### Bug Fixes

* Preserve whitespace when building properties ([#402](https://github.com/dvanoni/notero/issues/402)) ([f241ef6](https://github.com/dvanoni/notero/commit/f241ef66324df59965d0c4ebe3d8c8e9a9fe58cd))
* Update translations for Simplified Chinese ([#400](https://github.com/dvanoni/notero/issues/400)) ([8ba59f3](https://github.com/dvanoni/notero/commit/8ba59f31c4700def10f2acb891fb69766e6151be))

### [0.5.1](https://github.com/dvanoni/notero/compare/v0.5.0...v0.5.1) (2023-12-16)


### Features

* Support citation key property and page title format ([#397](https://github.com/dvanoni/notero/issues/397)) ([7469392](https://github.com/dvanoni/notero/commit/746939241e599054d091247d8dfd06de91c8481f))

## [0.5.0](https://github.com/dvanoni/notero/compare/v0.4.13...v0.5.0) (2023-12-13)


### Features

* Automatically sync notes ([#392](https://github.com/dvanoni/notero/issues/392)) ([df3c8d1](https://github.com/dvanoni/notero/commit/df3c8d1c6efcc29bf8a51bb4fbe4508dad5296e3))


### Bug Fixes

* Batch note block requests to comply with Notion API limits ([#393](https://github.com/dvanoni/notero/issues/393)) ([1659f3b](https://github.com/dvanoni/notero/commit/1659f3bfa49f2830ea831f41a728334d96b59657))

### [0.4.13](https://github.com/dvanoni/notero/compare/v0.4.12...v0.4.13) (2023-09-22)


### Bug Fixes

* Support Zotero window closing and reopening ([#340](https://github.com/dvanoni/notero/issues/340)) ([9d84462](https://github.com/dvanoni/notero/commit/9d844622698eb1e76f1b2d735279688df3293dc6))

### [0.4.12](https://github.com/dvanoni/notero/compare/v0.4.11...v0.4.12) (2023-09-17)


### Features

* Support inline math expressions in notes ([#334](https://github.com/dvanoni/notero/issues/334)) ([9e864a8](https://github.com/dvanoni/notero/commit/9e864a805ad6bd93dc58976d9b695bc40693e099))

### [0.4.11](https://github.com/dvanoni/notero/compare/v0.4.10...v0.4.11) (2023-08-15)


### Bug Fixes

* Downgrade `core-js` to v3.31.1 to fix issue with `use strict` ([#317](https://github.com/dvanoni/notero/issues/317)) ([c525841](https://github.com/dvanoni/notero/commit/c525841b024e182f7778fd81dc8d2305a513989f))

### [0.4.10](https://github.com/dvanoni/notero/compare/v0.4.9...v0.4.10) (2023-08-14)


### Features

* Support note highlight colors other than Zotero's ([#312](https://github.com/dvanoni/notero/issues/312)) ([af4d8fa](https://github.com/dvanoni/notero/commit/af4d8fa196fcd225dfb6750d84fc74336484c9a5))

### [0.4.9](https://github.com/dvanoni/notero/compare/v0.4.8...v0.4.9) (2023-07-31)


### Features

* Enable support for Zotero 7 ([#305](https://github.com/dvanoni/notero/issues/305)) ([da2779c](https://github.com/dvanoni/notero/commit/da2779cb85c2a92d5421dca26b3a81b61707294e))
* Localize Zotero 7 preference pane using Fluent ([#304](https://github.com/dvanoni/notero/issues/304)) ([2ab1715](https://github.com/dvanoni/notero/commit/2ab17156245fff8b3d6daa8e9f2d63b059e09846))

### [0.4.8](https://github.com/dvanoni/notero/compare/v0.4.7...v0.4.8) (2023-07-27)


### Features

* Add experimental support for syncing notes ([#290](https://github.com/dvanoni/notero/issues/290)) ([bb69ecb](https://github.com/dvanoni/notero/commit/bb69ecb834a85ee7672300714f37b7ae55b927a3))


### Bug Fixes

* Make timer functions work in both Zotero 6 and 7 ([#286](https://github.com/dvanoni/notero/issues/286)) ([9377ebf](https://github.com/dvanoni/notero/commit/9377ebf7576f3d500f2aff2809e0ea6e9677012f))

### [0.4.7](https://github.com/dvanoni/notero/compare/v0.4.6...v0.4.7) (2023-06-18)


### Features

* Sync date added ([#274](https://github.com/dvanoni/notero/issues/274)) ([c114b41](https://github.com/dvanoni/notero/commit/c114b412424b8db70ed5c349da35c5c90e710b1d))


### Bug Fixes

* Sync top-level items from context menu ([#226](https://github.com/dvanoni/notero/issues/226)) ([6b7ed9b](https://github.com/dvanoni/notero/commit/6b7ed9bff8f19aee5b9e257e5b035d46e99e54a9))

### [0.4.6](https://github.com/dvanoni/notero/compare/v0.4.5...v0.4.6) (2023-02-02)


### Features

* Use `VirtualizedTable` for collection sync preferences ([#223](https://github.com/dvanoni/notero/issues/223)) ([acb58f9](https://github.com/dvanoni/notero/commit/acb58f90d03692f3fceb7b56e70baa4646a5191e))

### [0.4.5](https://github.com/dvanoni/notero/compare/v0.4.4...v0.4.5) (2023-01-20)


### Bug Fixes

* Load default preferences upon plugin install or enable ([#215](https://github.com/dvanoni/notero/issues/215)) ([812b019](https://github.com/dvanoni/notero/commit/812b0199d36ec5c9b134030b9887bf1b26c83dba))

### [0.4.4](https://github.com/dvanoni/notero/compare/v0.4.3...v0.4.4) (2023-01-02)


### Features

* Add sync button to context menus ([#210](https://github.com/dvanoni/notero/issues/210)) ([5b7625b](https://github.com/dvanoni/notero/commit/5b7625ba269abe4db64d19b964fd0b1a3aad9c8b))

### [0.4.3](https://github.com/dvanoni/notero/compare/v0.4.2...v0.4.3) (2022-12-26)


### Features

* Sync `Collections` property to Notion ([#194](https://github.com/dvanoni/notero/issues/194)) ([d85bd5f](https://github.com/dvanoni/notero/commit/d85bd5fc1d3686867b4694e49cd17ff873a40faf))
* Sync items when collections or tags are modified ([#204](https://github.com/dvanoni/notero/issues/204)) ([a6cd503](https://github.com/dvanoni/notero/commit/a6cd503b7fa81380fedadc9803232f9040beac79))

### [0.4.2](https://github.com/dvanoni/notero/compare/v0.4.1...v0.4.2) (2022-12-24)


### Features

* Add note to Notion link attachment ([#190](https://github.com/dvanoni/notero/issues/190)) ([8737dde](https://github.com/dvanoni/notero/commit/8737ddea6d019656ddfe9bb8434d345ee5382295))


### Bug Fixes

* Show error when "read content" capability is missing ([#197](https://github.com/dvanoni/notero/issues/197)) ([6c4d5aa](https://github.com/dvanoni/notero/commit/6c4d5aab8c646fb3646fac0eedc43899eb49aac7))

### [0.4.1](https://github.com/dvanoni/notero/compare/v0.4.0...v0.4.1) (2022-12-13)


### Features

* Update to a bootstrapped plugin ([#187](https://github.com/dvanoni/notero/issues/187)) ([ad58fd0](https://github.com/dvanoni/notero/commit/ad58fd0c226e8b5cd67c5cc63fb34bd06f7d850c))

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
