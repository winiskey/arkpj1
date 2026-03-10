import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

async function writeJson(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export function createJsonStore(filePath, createDefaultValue) {
  let writeChain = Promise.resolve();

  async function ensureFile() {
    try {
      await access(filePath);
    } catch {
      const initialValue = await createDefaultValue();
      await writeJson(filePath, initialValue);
    }
  }

  async function read() {
    await ensureFile();
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  }

  async function replace(nextValue) {
    await writeJson(filePath, nextValue);
    return nextValue;
  }

  async function update(mutator) {
    const run = async () => {
      const currentValue = await read();
      const nextValue = await mutator(structuredClone(currentValue));
      await writeJson(filePath, nextValue);
      return nextValue;
    };

    const result = writeChain.then(run, run);
    writeChain = result.then(() => undefined, () => undefined);
    return result;
  }

  return {
    read,
    replace,
    update,
  };
}
