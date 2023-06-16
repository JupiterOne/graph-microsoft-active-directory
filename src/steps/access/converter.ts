import {
  createIntegrationEntity,
  createDirectRelationship,
  Entity,
  RelationshipClass,
  Relationship,
  parseTimePropertyValue,
} from '@jupiterone/integration-sdk-core';

import { Entities } from '../constants';
import {
  ActiveDirectoryComputer,
  ActiveDirectoryGroup,
  ActiveDirectoryUser,
} from '../../types';
import { parseLdapDatetime } from '../../ldap';

export function getGroupId(dn: string): string {
  return `ad_group:${dn}`;
}

export function createUserEntity(user: ActiveDirectoryUser): Entity {
  const id = `ad_user:${user.dn}`;

  return createIntegrationEntity({
    entityData: {
      source: user,
      assign: {
        _type: Entities.USER._type,
        _class: Entities.USER._class,
        _key: id,
        username: user.name,
        active: true,
        description: user.description,
        createdOn: parseLdapDatetime(user.whenCreated),
        updatedOn: parseLdapDatetime(user.whenChanged),
      },
    },
  });
}

export function createGroupEntity(group: ActiveDirectoryGroup): Entity {
  const id = getGroupId(group.dn);

  return createIntegrationEntity({
    entityData: {
      source: group,
      assign: {
        _type: Entities.GROUP._type,
        _class: Entities.GROUP._class,
        _key: id,
        name: group.name,
        description: group.description,
        createdOn: parseLdapDatetime(group.whenCreated),
        updatedOn: parseLdapDatetime(group.whenChanged),
      },
    },
  });
}

export function createDeviceEntity(computer: ActiveDirectoryComputer): Entity {
  const id = `ad_device:${computer.dn}`;
  const lastLogon =
    isNaN(Number(computer.lastLogonTimestamp)) ||
    Number(computer.lastLogonTimestamp) == 0
      ? undefined
      : parseTimePropertyValue(Number(computer.lastLogonTimestamp), 'ms');

  return createIntegrationEntity({
    entityData: {
      source: computer,
      assign: {
        _type: Entities.DEVICE._type,
        _class: Entities.DEVICE._class,
        _key: id,
        name: computer.name,
        deviceId: computer.dn,
        category: 'computer', // client.iterateDevices is specifically filtering on "COMPUTER"
        make: null,
        model: null,
        serial: null,
        operatingSystem: computer.operatingSystem,
        operatingSystemVersion: computer.operatingSystemVersion,
        isCriticalSystemObject: computer.isCriticalSystemObject == 'TRUE',
        lastLogon,
        createdOn: parseLdapDatetime(computer.whenCreated),
        updatedOn: parseLdapDatetime(computer.whenChanged),
        lastSeenOn: parseTimePropertyValue(new Date()), // Because we are doing the scanning ourselves with iterateDevices, the current time is the lastSeenOn value.
      },
    },
  });
}

export function createAccountUserRelationship(
  account: Entity,
  user: Entity,
): Relationship {
  return createDirectRelationship({
    _class: RelationshipClass.HAS,
    from: account,
    to: user,
  });
}
export function createAccountGroupRelationship(
  account: Entity,
  group: Entity,
): Relationship {
  return createDirectRelationship({
    _class: RelationshipClass.HAS,
    from: account,
    to: group,
  });
}

export function createAccountDeviceRelationship(
  account: Entity,
  device: Entity,
): Relationship {
  return createDirectRelationship({
    _class: RelationshipClass.HAS,
    from: account,
    to: device,
  });
}

export function createGroupUserRelationship(
  group: Entity,
  user: Entity,
): Relationship {
  return createDirectRelationship({
    _class: RelationshipClass.HAS,
    from: group,
    to: user,
  });
}

export function createGroupGroupRelationship(
  from: Entity,
  to: Entity,
): Relationship {
  return createDirectRelationship({
    _class: RelationshipClass.HAS,
    from: from,
    to: to,
  });
}
