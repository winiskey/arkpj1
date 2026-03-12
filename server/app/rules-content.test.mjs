import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const publicContentPath = fileURLToPath(new URL("../data/public-content.json", import.meta.url));

function findSection(data, sectionId) {
  return data.ruleSections.find((section) => section.id === sectionId);
}

test("public-content rule copy keeps the audited general/coefficient/finals lines", async () => {
  const publicContent = JSON.parse(await readFile(publicContentPath, "utf8"));
  const generalRules = findSection(publicContent, "section-general-rules");
  const coefficient = findSection(publicContent, "section-coefficient");
  const finals = findSection(publicContent, "section-finals-note");

  assert.ok(generalRules);
  assert.ok(coefficient);
  assert.ok(finals);

  const generalText = JSON.stringify(generalRules);
  const coefficientText = JSON.stringify(coefficient);
  const finalsText = JSON.stringify(finals);

  assert.match(generalText, /比赛期间可以存钱以增加余额/);
  assert.match(coefficientText, /总分 = 四人分数和 × 系数。系数初始值为 1。/);
  assert.match(finalsText, /决赛阶段将新增 BP 流程/);
});
