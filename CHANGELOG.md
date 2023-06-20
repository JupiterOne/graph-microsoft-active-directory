# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 3.1.1 - 2022-12-21

### Added

- `lastSeenOn`, `name`, `serial`, `isCriticalSystemObject`, and `lastLogon` to
  Device entities.

### Changed

- `make`, `model`, and `serialNumber` from "N/A" to null on Device entities.

## 3.1.0 - 2022-12-21

### Changed

- Search function now paginates responses.
- Pagination size is now a configurable field.

## 3.0.0 - 2022-11-07

### Changed

- Renamed config and environment variables to fix Windows issue.
  - USERNAME -> AD_USERNAME
  - PASSWORD -> AD_PASSWORD

### Added

- Introduced `yarn test:connection` to enable quick testing of credentials and
  LDAP connections. It uses the existing `.env` file with the following new
  values (optional):
  1. ADMIN_DN=uid=admin,ou=system
  2. ADMIN_PASSWORD=pass
  3. USER_DN=uid=user,ou=corp

## 2.1.1 - 2022-10-12

### Changed

- Added support for original config values.

## 2.1.0 - 2022-10-11

### Changed

- Enabled de-referencing of aliases. Believed it will resolve Error 0xa (10).
- Added exists check and logging around duplicate keys.
- Upgrade sdk-\* packages to v8.25.1
- Added `deviceId` to `ad_device` entity

## 2.0.0 - 2022-10-11

### Changed

- Renamed config and environment variables to align with use
  - CLIENT_URL -> LDAP_URL
  - CLIENT_DOMAIN -> BASE_DN
  - CLIENT_USERNAME -> USERNAME
  - CLIENT_PASSWORD -> PASSWORD
- Updated jupiterone.md and development.md docs
- Updated `ldapts` package
- Changed LDAP user query

## 1.0.0 - 2022-04-26

### Added

Initial Microsoft Active Directory integration.

- Ingest new entity `ad_account`
- Ingest new entity `ad_user`
- Ingest new entity `ad_group`
- Ingest new entity `ad_device`

- Build new relationship `ad_account_has_user`
- Build new relationship `ad_account_has_group`
- Build new relationship `ad_account_has_device`
- Build new relationship `ad_group_has_user`
