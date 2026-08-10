import type {
  CapacitiesObject,
  CreateObjectParams,
  SearchResult,
  Space,
  Structure,
  UpdateObjectParams,
} from './capacities-types';

const API_ORIGIN = 'https://api.capacities.io';

const MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 5000;

export class CapacitiesApiError extends Error {
  public readonly status: number;

  public constructor(status: number, message: string) {
    super(message || `Capacities API request failed with status ${status}`);
    this.name = 'CapacitiesApiError';
    this.status = status;
  }
}

export function isCapacitiesApiError(
  error: unknown,
): error is CapacitiesApiError {
  return error instanceof CapacitiesApiError;
}

export function isCapacitiesNotFoundError(error: unknown): boolean {
  return isCapacitiesApiError(error) && error.status === 404;
}

export function isCapacitiesUnauthorizedError(error: unknown): boolean {
  return isCapacitiesApiError(error) && error.status === 401;
}

export class CapacitiesClient {
  private readonly apiToken: string;
  private readonly fetch: typeof fetch;

  public constructor(apiToken: string, fetchFn: typeof fetch) {
    this.apiToken = apiToken;
    this.fetch = fetchFn;
  }

  public getSpace(): Promise<Space> {
    return this.request<Space>('/space');
  }

  public async getStructures(): Promise<Structure[]> {
    const { structures } = await this.request<{ structures: Structure[] }>(
      '/space/structures',
    );
    return structures;
  }

  public getObject(id: string): Promise<CapacitiesObject> {
    return this.request<CapacitiesObject>(
      `/object?id=${encodeURIComponent(id)}`,
    );
  }

  public createObject(params: CreateObjectParams): Promise<CapacitiesObject> {
    return this.request<CapacitiesObject>('/object', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  public updateObject(params: UpdateObjectParams): Promise<CapacitiesObject> {
    return this.request<CapacitiesObject>('/object', {
      method: 'PATCH',
      body: JSON.stringify(params),
    });
  }

  public async searchObjects(
    query: string,
    structureIds?: string[],
  ): Promise<SearchResult[]> {
    const { results } = await this.request<{ results: SearchResult[] }>(
      '/objects/search',
      {
        method: 'POST',
        body: JSON.stringify({ query, ...(structureIds && { structureIds }) }),
      },
    );
    return results;
  }

  /**
   * Appends Markdown content to an object, converted to blocks by Capacities.
   * Pass `parentBlockId` to nest the new content under an existing block
   * instead of appending to the end of the object's main content.
   */
  public appendMarkdown(
    id: string,
    markdown: string,
    { parentBlockId }: { parentBlockId?: string } = {},
  ): Promise<CapacitiesObject> {
    return this.request<CapacitiesObject>('/blocks/append', {
      method: 'POST',
      body: JSON.stringify({
        id,
        markdown,
        position: { type: 'end' },
        ...(parentBlockId && { parentBlockId }),
      }),
    });
  }

  public deleteBlock(
    objectId: string,
    blockId: string,
  ): Promise<CapacitiesObject> {
    const params = new URLSearchParams({ objectId, blockId });
    return this.request<CapacitiesObject>(`/block?${params.toString()}`, {
      method: 'DELETE',
    });
  }

  private async request<T>(
    path: string,
    init: RequestInit = {},
    attempt = 0,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set('Authorization', `Bearer ${this.apiToken}`);
    headers.set('Content-Type', 'application/json');

    const response = await this.fetch(`${API_ORIGIN}${path}`, {
      ...init,
      headers,
    });

    if (response.status === 429 && attempt < MAX_RETRIES) {
      await delay(getRetryDelayMs(response));
      return this.request<T>(path, init, attempt + 1);
    }

    if (!response.ok) {
      const body = await response.text();
      throw new CapacitiesApiError(response.status, body);
    }

    const text = await response.text();
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

function getRetryDelayMs(response: Response): number {
  const retryAfterSeconds = Number(response.headers.get('Retry-After'));
  return Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
    ? retryAfterSeconds * 1000
    : DEFAULT_RETRY_DELAY_MS;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getCapacitiesClient(
  apiToken: string,
  window: Window,
): CapacitiesClient {
  return new CapacitiesClient(apiToken, window.fetch.bind(window));
}
