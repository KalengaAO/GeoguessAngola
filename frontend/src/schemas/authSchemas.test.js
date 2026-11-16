import assert from "node:assert/strict";
import test from "node:test";
import { loginSchema, registerSchema } from "./authSchemas.js";

test("login requires a username and password and trims the username", () => {
    const result = loginSchema.safeParse({
        username: "  jogador  ",
        password: "pass",
    });

    assert.equal(result.success, true);
    assert.deepEqual(result.data, {
        username: "jogador",
        password: "pass",
    });
    assert.equal(
        loginSchema.safeParse({ username: "jogador", password: "" }).success,
        false
    );
});

test("registration requires a username and a password of at least eight characters", () => {
    assert.equal(
        registerSchema.safeParse({
            username: "jogador",
            password: "password",
        }).success,
        true
    );
    assert.equal(
        registerSchema.safeParse({
            username: "jogador",
            password: "short",
        }).success,
        false
    );
    assert.equal(
        registerSchema.safeParse({
            username: " ",
            password: "password",
        }).success,
        false
    );
});
