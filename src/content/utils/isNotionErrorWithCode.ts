import {
  NotionClientError,
  NotionErrorCode,
  isNotionClientError,
} from '@notionhq/client';

export function isNotionErrorWithCode<Code extends NotionErrorCode>(
  error: unknown,
  code: Code
): error is NotionClientError & { code: Code } {
  return isNotionClientError(error) && error.code === code;
}
