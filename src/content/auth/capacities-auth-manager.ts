import { LocalizableError } from '../errors';
import type { EventManager, Service, ServiceParams } from '../services';
import { getCapacitiesClient } from '../sync/capacities-client';

import {
  CapacitiesConnection,
  getConnection,
  removeConnection,
  saveConnection,
} from './storage';

export class CapacitiesAuthManager implements Service {
  private eventManager!: EventManager;

  public startup({ dependencies }: ServiceParams<'eventManager'>) {
    this.eventManager = dependencies.eventManager;
  }

  public getConnection(): Promise<CapacitiesConnection | undefined> {
    return getConnection();
  }

  public async getOptionalAuthToken(): Promise<string | undefined> {
    return (await getConnection())?.apiToken;
  }

  public async getRequiredAuthToken(): Promise<string> {
    const authToken = await this.getOptionalAuthToken();
    if (authToken) return authToken;

    throw new LocalizableError(
      'Capacities API token not available',
      'notero-error-missing-api-token',
    );
  }

  /**
   * Validates the given API token against the Capacities API and, if valid,
   * saves the resulting connection (API token plus the space it belongs to).
   */
  public async connect(
    apiToken: string,
    window: Window,
  ): Promise<CapacitiesConnection> {
    const client = getCapacitiesClient(apiToken, window);
    const space = await client.getSpace();

    const connection: CapacitiesConnection = {
      apiToken,
      spaceId: space.id,
      spaceTitle: space.title,
    };

    await saveConnection(connection);
    this.eventManager.emit('capacities-connection.add', connection);

    return connection;
  }

  public async disconnect(): Promise<void> {
    const connection = await getConnection();

    await removeConnection();

    if (connection) {
      this.eventManager.emit('capacities-connection.remove', connection);
    }
  }
}
