import fs from "node:fs";
import path from "node:path";

export interface Storage {
  /** Absolute local path for a key (workers need real files for FFmpeg). */
  localPath(key: string): string;
  putFile(key: string, data: Buffer | string): Promise<void>; // string = existing file path to copy
  exists(key: string): Promise<boolean>;
}

export class LocalStorage implements Storage {
  constructor(private root = path.resolve(process.env.STORAGE_DIR ?? "./storage")) {}
  localPath(key: string) {
    const p = path.resolve(this.root, key);
    if (!p.startsWith(this.root + path.sep)) throw new Error("invalid storage key");
    fs.mkdirSync(path.dirname(p), { recursive: true });
    return p;
  }
  async putFile(key: string, data: Buffer | string) {
    const p = this.localPath(key);
    if (typeof data === "string") fs.copyFileSync(data, p);
    else fs.writeFileSync(p, data);
  }
  async exists(key: string) {
    return fs.existsSync(this.localPath(key));
  }
}

let s: Storage | undefined;
export function getStorage(): Storage {
  return (s ??= new LocalStorage());
}
export function setStorage(x: Storage) {
  s = x;
}
