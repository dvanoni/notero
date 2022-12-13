export type PluginInfo = {
  pluginID: string;
  rootURI: string;
};

export interface Service {
  startup(info: PluginInfo): void;
  shutdown?(): void;
}
