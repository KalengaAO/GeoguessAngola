import assert from "node:assert/strict";
import test from "node:test";
import { getApiErrorMessage } from "./apiErrors.js";

test("formats field errors returned by the API", () => {
    assert.equal(
        getApiErrorMessage(
            { response: { data: { username: ["Já existe."], password: ["Inválida."] } } },
            "Erro"
        ),
        "Já existe. Inválida."
    );
});

test("uses API detail and fallback messages", () => {
    assert.equal(
        getApiErrorMessage({ response: { data: { detail: "Acesso negado." } } }, "Erro"),
        "Acesso negado."
    );
    assert.equal(getApiErrorMessage(new Error("network"), "Tenta novamente."), "Tenta novamente.");
});
