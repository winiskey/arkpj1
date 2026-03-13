import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateSamiScore,
  calculateSarkazScore,
  calculateSuiScore,
} from "./scoring.mjs";

test("calculateSamiScore applies ending bonuses and final multiplier", () => {
  const result = calculateSamiScore({
    "sa-score": 100,
    "sa-items": 2,
    "sa-plates": 1,
    "sa-stage-sands": true,
    "sa-combo": true,
    "sa-end-link": 150,
    "sa-gift": true,
  });

  assert.equal(result.rawScore, 495);
  assert.equal(result.multiplier, 1);
  assert.equal(result.previewScore, 495);
  assert.equal(result.formulaText, "(495.00)");
});

test("calculateSamiScore adds no-leak bonuses on top of ending stages", () => {
  const result = calculateSamiScore({
    "sa-score": 50,
    "sa-stage-gardener": true,
    "sa-stage-sentinel": true,
    "sa-gardener-nl": true,
    "sa-sentinel-nl": true,
  });

  assert.equal(result.rawScore, 650);
  assert.equal(result.previewScore, 650);
  assert.equal(result.formulaText, "(650.00)");
});

test("calculateSarkazScore applies non-karma relic penalties before the theme multiplier", () => {
  const result = calculateSarkazScore({
    "sk-score": 100,
    "sk-stage-foe": true,
    "sk-n4-done": true,
    "sk-end-relic": "bone",
  });

  assert.equal(result.rawScore, 415);
  assert.equal(result.previewScore, 311.25);
  assert.equal(result.formulaText, "(415.00 x 0.75)");
});

test("calculateSarkazScore handles karma branching and roll ancestor ending multiplier", () => {
  const result = calculateSarkazScore({
    "sk-score": 50,
    "sk-karma": true,
    "sk-n4-done": true,
    "sk-n4-conf": true,
    "sk-n4-perf": true,
    "sk-end-relic": "body",
    "sk-roll": true,
  });

  assert.equal(result.rawScore, 974);
  assert.equal(result.previewScore, 730.5);
  assert.equal(result.formulaText, "(974.00 x 0.75)");
});

test("calculateSuiScore zeros the theme when hard rule violations are present", () => {
  const result = calculateSuiScore({
    "sui-score": 200,
    "sui-steps": 151,
  });

  assert.equal(result.previewScore, 0);
  assert.equal(result.formulaText, "Rule violation => 0");
});

test("calculateSuiScore applies item bonuses and overflow deductions before the final multiplier", () => {
  const result = calculateSuiScore({
    "sui-score": 100,
    "sui-items": 130,
    "sui-steps": 110,
    "sui-6s": 1,
    "sui-stage-posz": true,
    "sui-it-xm": true,
    "sui-it-ws": true,
    "sui-it-yyq": true,
    "sui-it-wf": true,
    "sui-ending": "dqk",
    "sui-end-perf": true,
    "sui-item-a": true,
  });

  assert.equal(result.rawScore, 1670);
  assert.equal(result.multiplier, 0.48);
  assert.equal(result.previewScore, 801.6);
  assert.equal(result.formulaText, "(1670.00 x 0.48)");
});
