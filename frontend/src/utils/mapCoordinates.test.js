import assert from "node:assert/strict";
import test from "node:test";
import { roundMapCoordinate } from "./mapCoordinates.js";

test("rounds map coordinates to the API's six-decimal precision", () => {
    assert.equal(roundMapCoordinate(-8.838333333333), -8.838333);
    assert.equal(roundMapCoordinate(13.234444888888), 13.234445);
    assert.equal(roundMapCoordinate(-179.9999998), -180);
});
