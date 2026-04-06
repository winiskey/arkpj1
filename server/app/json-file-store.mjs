import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

async function writeTextAtomic(filePath, text) {
  await mkdir(dirname(filePath), { recursive: true });

  const tempPath = join(
    dirname(filePath),
    `.${basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );

  await writeFile(tempPath, text, "utf8");
  await rename(tempPath, filePath);
}

async function writeJsonAtomic(filePath, value) {
  await writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function readExistingText(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function replaceJsonFilesAtomic(entries) {
  const preparedEntries = await Promise.all(
    entries.map(async ({ filePath, value }, index) => ({
      filePath,
      value,
      originalText: await readExistingText(filePath),
      tempPath: join(
        dirname(filePath),
        `.${basename(filePath)}.${process.pid}.${Date.now()}.${index}.tmp`,
      ),
      nextText: `${JSON.stringify(value, null, 2)}\n`,
    })),
  );

  try {
    await Promise.all(
      preparedEntries.map(async (entry) => {
        await mkdir(dirname(entry.filePath), { recursive: true });
        await writeFile(entry.tempPath, entry.nextText, "utf8");
      }),
    );

    for (const entry of preparedEntries) {
      await rename(entry.tempPath, entry.filePath);
    }
  } catch (error) {
    await Promise.all(
      preparedEntries.map(async (entry) => {
        try {
          if (entry.originalText === null) {
            await rm(entry.filePath, { force: true });
          } else {
            await writeTextAtomic(entry.filePath, entry.originalText);
          }
        } catch {
          // Best-effort rollback.
        }

        try {
          await rm(entry.tempPath, { force: true });
        } catch {
          // Ignore temp cleanup failures during rollback.
        }
      }),
    );
    throw error;
  }

  return preparedEntries.map((entry) => structuredClone(entry.value));
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
    path: filePath,
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
