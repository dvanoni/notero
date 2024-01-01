import { isFullPageOrDatabase } from '@notionhq/client';
import type {
  DatabaseObjectResponse,
  PageObjectResponse,
  PartialDatabaseObjectResponse,
  PartialPageObjectResponse,
} from '@notionhq/client/build/src/api-endpoints';

export function isFullDatabase(
  response:
    | DatabaseObjectResponse
    | PartialDatabaseObjectResponse
    | PageObjectResponse
    | PartialPageObjectResponse,
): response is DatabaseObjectResponse {
  return isFullPageOrDatabase(response) && response.object === 'database';
}
