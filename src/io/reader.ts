import fs from 'fs';
import yaml from 'js-yaml';
import { ZodSchema } from 'zod';

export async function readYamlFile<T>(
  filePath: string,
  schema: ZodSchema,
): Promise<T> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const parsed = yaml.load(content);
  return schema.parse(parsed) as T;
}

export async function readJsonFile<T>(
  filePath: string,
  schema: ZodSchema,
): Promise<T> {
  const content = await fs.promises.readFile(filePath, 'utf-8');
  const parsed = JSON.parse(content);
  return schema.parse(parsed) as T;
}

export async function readTextFile(filePath: string): Promise<string> {
  return fs.promises.readFile(filePath, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.promises.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function dirExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.promises.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}
