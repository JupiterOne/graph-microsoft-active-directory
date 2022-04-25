export interface ActiveDirectoryUser {
  dn: string;
  cn: string;
  objectGUID: string;
  name: string;
  memberOf?: string | string[];
  description: string;
  whenCreated: string;
  whenChanged: string;
}

export interface ActiveDirectoryGroup {
  dn: string;
  cn: string;
  objectGUID: string;
  name: string;
  description: string;
  whenCreated: string;
  whenChanged: string;
  memberOf?: string | string[];
}

export interface ActiveDirectoryComputer {
  dn: string;
  cn: string;
  objectGUID: string;
  name: string;
  instanceType: string;
  operatingSystem: string;
  operatingSystemVersion: string;
  whenCreated: string;
  whenChanged: string;
}
