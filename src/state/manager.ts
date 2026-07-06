import path from 'path';
import { readYamlFile, readJsonFile, readTextFile, fileExists } from '../io/reader.js';
import { writeYamlFile, writeJsonFile, writeTextFile, mkdir } from '../io/writer.js';
import {
  ConfigSchema,
  ContractsSchema,
  OwnershipSchema,
  SlicesSchema,
  GraphSchema,
  SyncEventSchema,
  IntegrationStateSchema,
  Config,
  Contracts,
  Ownership,
  Slices,
  Graph,
  SyncEvent,
  IntegrationState,
} from '../schemas/index.js';

export class StateManager {
  private hackxDir: string;

  constructor(projectRoot: string = '.') {
    this.hackxDir = path.join(projectRoot, '.hackx');
  }

  // Config
  async readConfig(): Promise<Config> {
    return readYamlFile(path.join(this.hackxDir, 'config.yaml'), ConfigSchema);
  }

  async writeConfig(config: Config): Promise<void> {
    await writeYamlFile(path.join(this.hackxDir, 'config.yaml'), config);
  }

  async configExists(): Promise<boolean> {
    return fileExists(path.join(this.hackxDir, 'config.yaml'));
  }

  // Contracts
  async readContracts(): Promise<Contracts> {
    return readYamlFile(path.join(this.hackxDir, 'contracts.yaml'), ContractsSchema);
  }

  async writeContracts(contracts: Contracts): Promise<void> {
    await writeYamlFile(path.join(this.hackxDir, 'contracts.yaml'), contracts);
  }

  async contractsExist(): Promise<boolean> {
    return fileExists(path.join(this.hackxDir, 'contracts.yaml'));
  }

  // Ownership
  async readOwnership(): Promise<Ownership> {
    return readYamlFile(path.join(this.hackxDir, 'ownership.yaml'), OwnershipSchema);
  }

  async writeOwnership(ownership: Ownership): Promise<void> {
    await writeYamlFile(path.join(this.hackxDir, 'ownership.yaml'), ownership);
  }

  async ownershipExists(): Promise<boolean> {
    return fileExists(path.join(this.hackxDir, 'ownership.yaml'));
  }

  // Slices
  async readSlices(): Promise<Slices> {
    return readJsonFile(path.join(this.hackxDir, 'slices.json'), SlicesSchema);
  }

  async writeSlices(slices: Slices): Promise<void> {
    await writeJsonFile(path.join(this.hackxDir, 'slices.json'), slices);
  }

  async slicesExist(): Promise<boolean> {
    return fileExists(path.join(this.hackxDir, 'slices.json'));
  }

  // Graph
  async readGraph(): Promise<Graph> {
    return readJsonFile(path.join(this.hackxDir, 'graph.json'), GraphSchema);
  }

  async writeGraph(graph: Graph): Promise<void> {
    await writeJsonFile(path.join(this.hackxDir, 'graph.json'), graph);
  }

  async graphExists(): Promise<boolean> {
    return fileExists(path.join(this.hackxDir, 'graph.json'));
  }

  // Sync events
  async readSyncEvent(filename: string): Promise<SyncEvent> {
    return readJsonFile(
      path.join(this.hackxDir, 'sync', filename),
      SyncEventSchema,
    );
  }

  async writeSyncEvent(filename: string, event: SyncEvent): Promise<void> {
    await writeJsonFile(path.join(this.hackxDir, 'sync', filename), event);
  }

  async readAllSyncEvents(): Promise<SyncEvent[]> {
    const syncDir = path.join(this.hackxDir, 'sync');
    try {
      const files = await (await import('fs')).promises.readdir(syncDir);
      const events: SyncEvent[] = [];
      for (const file of files.filter(f => f.endsWith('.json'))) {
        const event = await this.readSyncEvent(file);
        events.push(event);
      }
      return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    } catch {
      return [];
    }
  }

  // Integration state
  async readIntegrationState(): Promise<IntegrationState> {
    const file = path.join(this.hackxDir, 'integration_state.json');
    if (!(await fileExists(file))) {
      return { last_validated_commit: null, merge_history: [] };
    }
    return readJsonFile(file, IntegrationStateSchema);
  }

  async writeIntegrationState(state: IntegrationState): Promise<void> {
    await writeJsonFile(path.join(this.hackxDir, 'integration_state.json'), state);
  }

  // Conventions
  async readConventions(): Promise<string> {
    return readTextFile(path.join(this.hackxDir, 'conventions.md'));
  }

  async writeConventions(content: string): Promise<void> {
    await writeTextFile(path.join(this.hackxDir, 'conventions.md'), content);
  }

  async conventionsExist(): Promise<boolean> {
    return fileExists(path.join(this.hackxDir, 'conventions.md'));
  }

  // Schema
  async readSchema(): Promise<string> {
    return readTextFile(path.join(this.hackxDir, 'schema.sql'));
  }

  async writeSchema(content: string): Promise<void> {
    await writeTextFile(path.join(this.hackxDir, 'schema.sql'), content);
  }

  async schemaExists(): Promise<boolean> {
    return fileExists(path.join(this.hackxDir, 'schema.sql'));
  }

  // Utility
  async ensureHacksesDir(): Promise<void> {
    await mkdir(this.hackxDir);
  }
}
