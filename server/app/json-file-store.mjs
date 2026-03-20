import { access, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

async function writeJsonAtomic(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });

  const tempPath = join(
    dirname(filePath),
    `.${basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );

  await writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(tempPath, filePath);
}

export function createJsonFileStore(filePath, createDefaultValue) {
  let queue = Promise.resolve();

  async function ensureFile() {
    try {
      await access(filePath);
    } catch {
      const initialValue = await createDefaultValue();
      await writeJsonAtomic(filePath, initialValue);
    }
  }

  async function readCurrent() {
    await ensureFile();
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  }

  function enqueue(task) {
    const run = queue.then(task, task);
    queue = run.then(() => undefined, () => undefined);
    return run;
  }

  return {
    read() {
      return enqueue(async () => readCurrent());
    },
    replace(nextValue) {
      return enqueue(async () => {
        await ensureFile();
        await writeJsonAtomic(filePath, nextValue);
        return structuredClone(nextValue);
      });
    },
    update(mutator) {
      return enqueue(async () => {
        const currentValue = await readCurrent();
        const nextValue = await mutator(structuredClone(currentValue));
        await writeJsonAtomic(filePath, nextValue);
        return structuredClone(nextValue);
      });
    },
  };
}
