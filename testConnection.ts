import * as ldapts from '@jupiterone/ldapts';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { authenticate } from 'ldap-authentication';
import ldapjs from 'ldapjs';

dotenv.config({
  path: path.join(__dirname, '.env'),
});

const DEFAULT_BASE_DN = 'cn=root';
const DEFAULT_LDAP_URL = 'ldap://127.0.0.1:1389';
const DEFAULT_USERNAME = 'cn@root.com';
const DEFAULT_PASSWORD = 'secret';

const config = {
  ldapUrl: process.env.LDAP_URL || DEFAULT_LDAP_URL,
  baseDN: process.env.BASE_DN || DEFAULT_BASE_DN,
  username: process.env.AD_USERNAME || DEFAULT_USERNAME,
  password: process.env.AD_PASSWORD || DEFAULT_PASSWORD,
  verbose: process.env.AD_VERBOSE !== 'false',
  adminDn: process.env.ADMIN_DN,
  adminPassword: process.env.ADMIN_PASSWORD,
  userDN: process.env.USER_DN,
};

const client = new ldapts.Client({
  url: config.ldapUrl,
});

const ldapjsClient = ldapjs.createClient({
  url: config.ldapUrl,
});
ldapjsClient.on('error', (e) => {
  console.error('ldapjs:', e);
});

void (async () => {
  const safeConfig = Object.assign({}, config);
  // @ts-ignore
  delete safeConfig.password;
  delete safeConfig.adminPassword;

  console.log(`
    Testing Connection using...
  `);
  for (const [key, value] of Object.entries(safeConfig)) {
    console.log(`       ${key}: ${value}`);
  }

  await Promise.allSettled([
    attemptWrapper(
      [
        '\n1.0-----------------------------------------------------',
        `Testing ldapts client.bind with username & password`,
      ],
      () => client.bind(config.username, config.password),
    ),

    attemptWrapper(
      [
        '\n1.1 -----------------------------------------------------',
        `Testing ldapts client.bind with userDN & password`,
      ],
      () => client.bind(config.userDN!, config.password),
    ),

    attemptWrapper(
      [
        '\n1.2-----------------------------------------------------',
        `Testing ldapts client.search without bind.`,
      ],
      () => {
        return new ldapts.Client({
          url: config.ldapUrl,
        }).search(config.baseDN, {
          filter: '(&(objectClass=user)(objectCategory=person))',
          derefAliases: 'always',
        }) as Promise<any>;
      },
    ),

    attemptWrapper(
      [
        '2.0 -----------------------------------------------------',
        `Testing ldap-authentication using userDn & userPassword `,
        'User authenticate without getting user details',
      ],
      () =>
        authenticate({
          ldapOpts: {
            url: config.ldapUrl,
            tlsOptions: {
              rejectUnauthorized: false,
            },
          },
          userDn: config.userDN, // example 'uid=gauss,dc=example,dc=com'
          userPassword: config.password,
        }),
    ),

    attemptWrapper(
      [
        '2.1 -----------------------------------------------------',
        `Testing ldap-authentication via admin & email username`,
      ],
      () =>
        authenticate({
          ldapOpts: {
            url: config.ldapUrl,
            tlsOptions: {
              rejectUnauthorized: false,
            },
          },
          adminDn: config.adminDn,
          adminPassword: config.adminPassword,
          userPassword: config.password,
          userSearchBase: config.baseDN,
          usernameAttribute: 'email',
          username: config.username,
        }),
    ),

    attemptWrapper(
      [
        '2.2 -----------------------------------------------------',
        `Testing ldap-authentication via admin & uid username`,
      ],
      () =>
        authenticate({
          ldapOpts: {
            url: config.ldapUrl,
            tlsOptions: {
              rejectUnauthorized: false,
            },
          },
          adminDn: config.adminDn,
          adminPassword: config.adminPassword,
          userPassword: config.password,
          userSearchBase: config.baseDN,
          usernameAttribute: 'uid',
          username: config.username,
        }),
    ),

    attemptWrapper(
      [
        '2.3 -----------------------------------------------------',
        `Testing ldap-authentication via username & password`,
      ],
      () =>
        authenticate({
          ldapOpts: {
            url: config.ldapUrl,
            tlsOptions: {
              rejectUnauthorized: false,
            },
          },
          userPassword: config.password,
          userDn: config.username,
        }),
    ),

    attemptWrapper(
      [
        '3.0 -----------------------------------------------------',
        `Testing ldapjs using username & password`,
      ],
      () =>
        new Promise((resolve, reject) => {
          ldapjsClient.bind(config.username, config.password, (err, res) => {
            if (err instanceof Error) {
              reject(err);
              return;
            }
            resolve(res);
          });
        }),
    ),
    attemptWrapper(
      [
        '3.1 -----------------------------------------------------',
        `Testing ldapjs using userDn & password`,
      ],
      () =>
        new Promise((resolve, reject) => {
          ldapjsClient.bind(config.userDN, config.password, (err, res) => {
            if (err instanceof Error) {
              reject(err);
              return;
            }
            resolve(res);
          });
        }),
    ),
    attemptWrapper(
      [
        '3.2 -----------------------------------------------------',
        `Testing ldapjs using adminDn & adminPassword`,
      ],
      () =>
        new Promise((resolve, reject) => {
          ldapjsClient.bind(
            config.adminDn,
            config.adminPassword,
            (err, res) => {
              if (err instanceof Error) {
                reject(err);
                return;
              }
              resolve(res);
            },
          );
        }),
    ),
    attemptWrapper(
      [
        '3.3 -----------------------------------------------------',
        `Testing ldapjs to bind anonymously via search`,
      ],
      () =>
        new Promise((resolve, reject) => {
          try {
            const newClient = ldapjs.createClient({
              url: config.ldapUrl,
            });

            newClient.on('error', (e) => {
              reject(e);
            });

            newClient.search(
              config.baseDN,
              'objectCategory=person',
              (err, res) => {
                if (err instanceof Error) {
                  reject(err);
                  return;
                }
                resolve(res);
              },
            );
          } catch (e) {
            reject(e);
          }
        }),
    ),
  ]);
})();

async function attemptWrapper(
  logs: string[],
  attemptFunc: () => Promise<void>,
) {
  let result;
  let isError = false;
  try {
    result = await attemptFunc();
  } catch (e) {
    isError = true;
    result = e;
  }

  logs.forEach((log, index) => {
    if (index === 0) {
      console.log('\n');
    }
    console.log(log);
  });
  if (isError) {
    console.error('Failed!');
  } else {
    console.log('Success!');
  }

  if (config.verbose) {
    console.log(result);
  } else {
    console.log(JSON.stringify(result).substring(0, 150));
  }
}
