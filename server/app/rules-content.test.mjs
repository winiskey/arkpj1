import test from "node:test";
import assert from "node:assert/strict";
import { readPublicContentSeed } from "./public-content-seed.mjs";

function findSection(data, sectionId) {
  return data.ruleSections.find((section) => section.id === sectionId);
}

test("public-content rule copy keeps the audited general/coefficient/finals lines", async () => {
  const publicContent = await readPublicContentSeed();
  const generalRules = findSection(publicContent, "section-general-rules");
  const coefficient = findSection(publicContent, "section-coefficient");
  const finals = findSection(publicContent, "section-finals-note");

  assert.ok(generalRules);
  assert.ok(coefficient);
  assert.ok(finals);

  const generalText = JSON.stringify(generalRules);
  const coefficientText = JSON.stringify(coefficient);
  const finalsText = JSON.stringify(finals);

  assert.match(generalText, /商店取源石锭时全队共享余额/);
  assert.match(coefficientText, /总分 = 四人结算分之和 × 系数。系数初始值为 1。/);
  assert.match(finalsText, /决赛阶段采用只 P 不 B 的 Pick 流程/);
  assert.match(finalsText, /双方轮流 Pick 3 个/);
  assert.match(finalsText, /萨卡兹主题最终结算分由 ×75% 调整为 ×85%/);
  assert.match(finalsText, /界园主题最终结算分由 ×40% 调整为 ×50%/);
});
