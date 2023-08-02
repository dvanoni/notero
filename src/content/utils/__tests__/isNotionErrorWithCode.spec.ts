import { APIErrorCode } from '@notionhq/client';
import { APIResponseError } from '@notionhq/client/build/src/errors';
import { mock } from 'jest-mock-extended';

import { isNotionErrorWithCode } from '../isNotionErrorWithCode';

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
