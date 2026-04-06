import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { replaceJsonFilesAtomic } from "./json-file-store.mjs";

test("replaceJsonFilesAtomic restores already-committed files when a later rename fails", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "ark-json-store-"));
  const fileA = join(tempDir, "a.json");
  const fileB = join(tempDir, "b.json");
  const invalidTarget = join(tempDir, "occupied");

  await writeFile(fileA, '{ "value": "old-a" }\n', "utf8");
  await writeFile(fileB, '{ "value": "old-b" }\n', "utf8");
  await mkdir(invalidTarget);

  await assert.rejects(
    () => replaceJsonFilesAtomic([
      { filePath: fileA, value: { value: "new-a" } },
      { filePath: invalidTarget, value: { value: "new-b" } },
    ]),
  );

  assert.equal(await readFile(fileA, "utf8"), '{ "value": "old-a" }\n');
  assert.equal(await readFile(fileB, "utf8"), '{ "value": "old-b" }\n');
});
