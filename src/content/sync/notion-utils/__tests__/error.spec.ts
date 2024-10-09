import { APIErrorCode } from '@notionhq/client';
import { APIResponseError } from '@notionhq/client/build/src/errors';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';

import { isArchivedOrNotFoundError, isNotionErrorWithCode } from '../error';

describe('isNotionErrorWithCode', () => {
  it('returns false for generic error', () => {
    const error = new Error('Generic error');

    expect(isNotionErrorWithCode(error, APIErrorCode.ObjectNotFound)).toBe(
      false,
    );
  });

  it('returns false when error code does not match', () => {
    const error = new APIResponseError({
      code: APIErrorCode.InternalServerError,
      headers: mock<APIResponseError['headers']>(),
      message: 'Fake error',
      rawBodyText: 'Fake error',
      status: 500,
    });

    expect(isNotionErrorWithCode(error, APIErrorCode.ObjectNotFound)).toBe(
      false,
    );
  });

  it('returns true when error code matches', () => {
    const error = new APIResponseError({
      code: APIErrorCode.ObjectNotFound,
      headers: mock<APIResponseError['headers']>(),
      message: 'Fake error',
      rawBodyText: 'Fake error',
      status: 404,
    });

    expect(isNotionErrorWithCode(error, APIErrorCode.ObjectNotFound)).toBe(
      true,
    );
  });
});

describe('isArchivedOrNotFoundError', () => {
  it('returns false for generic error', () => {
    const error = new Error('Generic error');

    expect(isArchivedOrNotFoundError(error)).toBe(false);
  });

  it('returns false for other API errors', () => {
    const error = new APIResponseError({
      code: APIErrorCode.InternalServerError,
      headers: mock<APIResponseError['headers']>(),
      message: 'Fake error',
      rawBodyText: 'Fake error',
      status: 500,
    });

    expect(isArchivedOrNotFoundError(error)).toBe(false);
  });

  it('returns true for not found error', () => {
    const error = new APIResponseError({
      code: APIErrorCode.ObjectNotFound,
      headers: mock<APIResponseError['headers']>(),
      message: 'Fake error',
      rawBodyText: 'Fake error',
      status: 404,
    });

    expect(isArchivedOrNotFoundError(error)).toBe(true);
  });

  it('returns true for archived error', () => {
    const error = new APIResponseError({
      code: APIErrorCode.ValidationError,
      headers: mock<APIResponseError['headers']>(),
      message:
        "Can't edit page on block with an archived ancestor. You must unarchive the ancestor before editing page.",
      rawBodyText: 'Fake error',
      status: 400,
    });

    expect(isArchivedOrNotFoundError(error)).toBe(true);
  });
});
