import {
  IntegrationLogger,
  IntegrationProviderAPIError,
  IntegrationProviderAuthenticationError,
} from '@jupiterone/integration-sdk-core';
import * as ldapts from '@jupiterone/ldapts';
import { ResourceIteratee } from './client';

const DEFAULT_PAGE_SIZE = 100;
export interface LdapClient {
  /**
   * Searches active directory for resources using the provided filter.
   *
   * @param filter the active directory search term to use to search for resources, e.g. objectClass=Computer
   * @returns all matching resources
   */
  search<T>(filter: string, iteratee: ResourceIteratee<T>): Promise<void>;

  /**
   * Verifies authentication by doing a bind action.
   */
  verifyAuthentication(): Promise<void>;
}

interface LdapAdapterConfig {
  url: string;
  username: string;
  password: string;
  baseDN: string;
  logger: IntegrationLogger;
  pageSize?: string;
}

type NextPageResults =
  | {
      nextPage: true;
      cookie: Buffer;
    }
  | { nextPage: false; cookie: undefined };

function nextPageResults(
  response: Awaited<ReturnType<ldapts.Client['search']>>,
): NextPageResults {
  if (response.searchEntries.length) {
    const returnedPageControl = response.controls
      ?.filter((ctrl) => ctrl instanceof ldapts.PagedResultsControl)
      .at(0) as ldapts.PagedResultsControl | undefined;
    const cookie = returnedPageControl?.value?.cookie;
    if (cookie?.length) {
      return { nextPage: true, cookie };
    }
  }
  return { nextPage: false, cookie: undefined };
}

export class LdapTSAdapter implements LdapClient {
  private client: ldapts.Client;
  private config: LdapAdapterConfig;

  constructor(readonly cfg: LdapAdapterConfig) {
    this.config = cfg;
    this.client = new ldapts.Client({
      url: this.config.url,
    });
  }

  async search<T>(
    filter: string,
    iteratee: ResourceIteratee<T>,
  ): Promise<void> {
    const pageSize = this.config.pageSize
      ? Number(this.config.pageSize)
      : DEFAULT_PAGE_SIZE;
    try {
      await this.client.bind(this.config.username, this.config.password);

      // It appears that ldapts handles pagination internally.  Passing in
      // a control value causes the error `Error: Should not specify PagedResultsControl`
      // Specifying just pageSize to prevent maxing out server side limits.

      // TODO (adam-in-ict) Do we need to investigate alternatives that let us
      // iterate on the results as they come in so that we aren't faced with an
      // oversized result that has to fit in the available memory?

      // Issue added to ldapts project asking about a method for processing
      // pages as they're received here:  https://github.com/ldapts/ldapts/issues/126
      let nextPage = false;
      let pageControl = new ldapts.PagedResultsControl({
        value: {
          size: pageSize,
        },
      });

      do {
        const res = await this.client.search(
          this.config.baseDN,
          {
            filter,
            derefAliases: 'always',
          },
          [pageControl],
        );

        for (const entry of res.searchEntries) {
          await iteratee(entry as T);
        }

        const pageResults = nextPageResults(res);
        nextPage = pageResults.nextPage;

        if (pageResults.nextPage) {
          pageControl = new ldapts.PagedResultsControl({
            value: {
              size: pageSize,
              cookie: pageResults.cookie,
            },
          });
        }
      } while (nextPage);
    } catch (err) {
      if (err instanceof ldapts.SizeLimitExceededError) {
        this.config.logger.error(
          `Encountered a SizeLimitExceededError.  Page size of this request was `,
          this.config.pageSize,
        );
        throw new IntegrationProviderAPIError({
          code: err.code.toString(),
          message:
            'Server unable to complete request.  Please raise the server size limit or decrease the page size in your configuration.',
          endpoint: this.config.baseDN,
          status: err.message,
          statusText: err.stack || '',
        });
      } else {
        throw err;
      }
    } finally {
      await this.client.unbind();
    }
  }

  async verifyAuthentication(): Promise<void> {
    try {
      await this.client.bind(this.config.username, this.config.password);
    } catch (err) {
      throw new IntegrationProviderAuthenticationError({
        cause: err,
        endpoint: this.config.url,
        status: 500,
        statusText: 'Unable to bind client',
      });
    } finally {
      await this.client.unbind();
    }
  }
}

/**
 * Parses an ldap datetime string into a timestamp using new Date(date).getTime().
 *
 * @param timestamp the ldap datetime string, e.g. 20220311153154.0Z
 * @returns a time value in milliseconds since epoch
 */
export function parseLdapDatetime(timestamp: string): number | undefined {
  if (!timestamp) {
    return;
  }
  const [first] = timestamp.split('.');
  const yyyy = first.substring(0, 4);
  const MM = first.substring(4, 6);
  const dd = first.substring(6, 8);
  const hh = first.substring(8, 10);
  const mm = first.substring(10, 12);
  const ss = first.substring(12, 14);

  return new Date(`${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`).getTime();
}
