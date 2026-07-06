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
  private hacksesDir: string;

  constructor(projectRoot: string = '.') {
    this.hacksesDir = path.join(projectRoot, '.hackses');
  }

  // Config
  async readConfig(): Promise<Config> {
    return readYamlFile(path.join(this.hacksesDir, 'config.yaml'), ConfigSchema);
  }

  async writeConfig(config: Config): Promise<void> {
    await writeYamlFile(path.join(this.hacksesDir, 'config.yaml'), config);
  }

  async configExists(): Promise<boolean> {
    return fileExists(path.join(this.hacksesDir, 'config.yaml'));
  }

  // Contracts
  async readContracts(): Promise<Contracts> {
    return readYamlFile(path.join(this.hacksesDir, 'contracts.yaml'), ContractsSchema);
  }

  async writeContracts(contracts: Contracts): Promise<void> {
    await writeYamlFile(path.join(this.hacksesDir, 'contracts.yaml'), contracts);
  }

  async contractsExist(): Promise<boolean> {
    return fileExists(path.join(this.hacksesDir, 'contracts.yaml'));
  }

  // Ownership
  async readOwnership(): Promise<Ownership> {
    return readYamlFile(path.join(this.hacksesDir, 'ownership.yaml'), OwnershipSchema);
  }

  async writeOwnership(ownership: Ownership): Promise<void> {
    await writeYamlFile(path.join(this.hacksesDir, 'ownership.yaml'), ownership);
  }

  async ownershipExists(): Promise<boolean> {
    return fileExists(path.join(this.hacksesDir, 'ownership.yaml'));
  }

  // Slices
  async readSlices(): Promise<Slices> {
    return readJsonFile(path.join(this.hacksesDir, 'slices.json'), SlicesSchema);
  }

  async writeSlices(slices: Slices): Promise<void> {
    await writeJsonFile(path.join(this.hacksesDir, 'slices.json'), slices);
  }

  async slicesExist(): Promise<boolean> {
    return fileExists(path.join(this.hacksesDir, 'slices.json'));
  }

  // Graph
  async readGraph(): Promise<Graph> {
    return readJsonFile(path.join(this.hacksesDir, 'graph.json'), GraphSchema);
  }

  async writeGraph(graph: Graph): Promise<void> {
    await writeJsonFile(path.join(this.hacksesDir, 'graph.json'), graph);
  }

  async graphExists(): Promise<boolean> {
    return fileExists(path.join(this.hacksesDir, 'graph.json'));
  }

  // Sync events
  async readSyncEvent(filename: string): Promise<SyncEvent> {
    return readJsonFile(
      path.join(this.hacksesDir, 'sync', filename),
      SyncEventSchema,
    );
  }

  async writeSyncEvent(filename: string, event: SyncEvent): Promise<void> {
    await writeJsonFile(path.join(this.hacksesDir, 'sync', filename), event);
  }

  async readAllSyncEvents(): Promise<SyncEvent[]> {
    const syncDir = path.join(this.hacksesDir, 'sync');
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
    const file = path.join(this.hacksesDir, 'integration_state.json');
    if (!(await fileExists(file))) {
      return { last_validated_commit: null, merge_history: [] };
    }
    return readJsonFile(file, IntegrationStateSchema);
  }

  async writeIntegrationState(state: IntegrationState): Promise<void> {
    await writeJsonFile(path.join(this.hacksesDir, 'integration_state.json'), state);
  }

  // Conventions
  async readConventions(): Promise<string> {
    return readTextFile(path.join(this.hacksesDir, 'conventions.md'));
  }

  async writeConventions(content: string): Promise<void> {
    await writeTextFile(path.join(this.hacksesDir, 'conventions.md'), content);
  }

  async conventionsExist(): Promise<boolean> {
    return fileExists(path.join(this.hacksesDir, 'conventions.md'));
  }

  // Schema
  async readSchema(): Promise<string> {
    return readTextFile(path.join(this.hacksesDir, 'schema.sql'));
  }

  async writeSchema(content: string): Promise<void> {
    await writeTextFile(path.join(this.hacksesDir, 'schema.sql'), content);
  }

  async schemaExists(): Promise<boolean> {
    return fileExists(path.join(this.hacksesDir, 'schema.sql'));
  }

  // Utility
  async ensureHacksesDir(): Promise<void> {
    await mkdir(this.hacksesDir);
  }
}
