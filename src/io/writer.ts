import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export async function writeYamlFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  const content = yaml.dump(data, { lineWidth: -1 });
  await fs.promises.writeFile(filePath, content, 'utf-8');
}

export async function writeJsonFile(
  filePath: string,
  data: unknown,
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  const content = JSON.stringify(data, null, 2);
  await fs.promises.writeFile(filePath, content, 'utf-8');
}

export async function writeTextFile(
  filePath: string,
  content: string,
): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.promises.mkdir(dir, { recursive: true });
  await fs.promises.writeFile(filePath, content, 'utf-8');
}

export async function mkdir(dirPath: string): Promise<void> {
  await fs.promises.mkdir(dirPath, { recursive: true });
}
