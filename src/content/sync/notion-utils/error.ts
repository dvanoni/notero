import {
  APIErrorCode,
  NotionClientError,
  NotionErrorCode,
  isNotionClientError,
} from '@notionhq/client';

export function isNotionErrorWithCode<Code extends NotionErrorCode>(
  error: unknown,
  code: Code,
): error is NotionClientError & { code: Code } {
  return isNotionClientError(error) && error.code === code;
}

export function isArchivedOrNotFoundError(
  error: unknown,
): error is NotionClientError & {
  code: APIErrorCode.ObjectNotFound | APIErrorCode.ValidationError;
} {
  return (
    isNotionErrorWithCode(error, APIErrorCode.ObjectNotFound) ||
    (isNotionErrorWithCode(error, APIErrorCode.ValidationError) &&
      error.message.includes('archive'))
  );
}
