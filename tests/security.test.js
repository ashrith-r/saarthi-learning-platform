import test from "node:test";
import assert from "node:assert/strict";

process.env.MONGO_URL ||= "mongodb://127.0.0.1:27017/saarthi_test";
process.env.JWT_SECRET ||= "test-only-secret-never-use-in-production";
process.env.NODE_ENV = "test";
const { requireSameOrigin, loadUser } = await import("../middleware/middleware.js");
const { submitQuiz, renderQuizResult } = await import("../controllers/controller.js");
const { verifyEmail, resetPassword, logout } = await import("../controllers/auth_controller.js");
const { default: quizModel } = await import("../models/quiz.js");
const { default: attemptModel } = await import("../models/quizAttempt.js");
const { default: otpModel } = await import("../models/otp.js");
const { default: sessionModel } = await import("../models/session.js");
const { default: jwt } = await import("jsonwebtoken");
const { default: app } = await import("../app.js");

function response() {
  return {
    locals: {}, cookies: [], cleared: [],
    status(code) { this.statusCode = code; return this; },
    send(body) { this.body = body; return this; },
    redirect(url) { this.redirected = url; return this; },
    render(view, data) { this.view = view; this.data = data; },
    cookie(name, value) { this.cookies.push({ name, value }); },
    clearCookie(name) { this.cleared.push(name); }
  };
}
function replace(t, model, method, fn) {
  const original = model[method];
  model[method] = fn;
  t.after(() => { model[method] = original; });
}

for (const source of ["https://school.example", "https://evil.example", "null", undefined]) {
  test(`form origin: ${source}`, () => {
    const res = response();
    let allowed = false;
    requireSameOrigin({ protocol: "https", get: name => name === "host" ? "school.example" : name === "origin" ? source : undefined }, res, () => { allowed = true; });
    assert.equal(allowed, source === "https://school.example");
    if (!allowed) assert.equal(res.statusCode, 403);
  });
}

test('opaque-origin forms require the correct session-bound token',()=>{
  const token='a'.repeat(64);
  let allowed=false;
  requireSameOrigin({body:{_csrf:token},session:{csrfToken:token},get:()=> 'null'},response(),()=>{allowed=true;});
  assert.equal(allowed,true);
  const res=response();
  requireSameOrigin({body:{_csrf:'é'.repeat(64)},session:{csrfToken:token},get:()=> 'null'},res,()=>assert.fail('Invalid token accepted'));
  assert.equal(res.statusCode,403);
});

test("quiz results are queried with the current user's identity", async t => {
  let filter;
  replace(t, attemptModel, "findOne", query => {
    filter = query;
    return { populate() { return this; }, then(resolve) { resolve(null); } };
  });
  const res = response();
  await renderQuizResult({ params: { attemptId: "attempt" }, user: { _id: "student" }, flash() {} }, res);
  assert.deepEqual(filter, { _id: "attempt", user: "student" });
  assert.equal(res.view, undefined);
});

for (const submitted of [undefined, "invalid-option", { injected: true }, "a", "b"]) {
  test(`quiz grading accepts only options belonging to the question: ${JSON.stringify(submitted)}`, async t => {
    replace(t, quizModel, "findById", () => ({ populate: async () => ({ _id: "quiz", questions: [{ _id: "question", options: [{ _id: "a" }, { _id: "b" }], correctOption: "a", chapter: "Algebra", tags: [] }] }) }));
    let attempt;
    replace(t, attemptModel, "create", async data => { attempt = data; return { _id: "attempt" }; });
    await submitQuiz({ params: { id: "quiz" }, body: { answers: { question: submitted } }, user: { _id: "student" }, flash() {} }, response());
    assert.equal(attempt.score, submitted === "a" ? 1 : 0);
    assert.equal(typeof attempt.answers[0].isCorrect, "boolean");
    assert.equal(attempt.answers[0].selectedOption, ["a", "b"].includes(submitted) ? submitted : null);
  });
}

for (const [handler, purpose] of [[verifyEmail, "verify-email"], [resetPassword, "reset-password"]]) {
  test(`OTP enforces expiry, purpose and atomic consumption: ${purpose}`, async t => {
    let filter;
    replace(t, otpModel, "findOneAndDelete", async query => { filter = query; return null; });
    const now = Date.now();
    await handler({ body: { email: "USER@example.com", otpEntered: "123456", password: "valid-password", confirm: "valid-password" }, query: {}, flash() {} }, response());
    assert.equal(filter.email, "user@example.com");
    assert.equal(filter.purpose, purpose);
    assert.ok(filter.createdAt.$gt.getTime() >= now - 600000);
  });
}

test("revoked sessions cannot authenticate using an unexpired access token", async t => {
  replace(t, sessionModel, "findOne", async () => null);
  const req = { cookies: { accessToken: jwt.sign({ id: "user", sessionID: "session" }, process.env.JWT_SECRET, { expiresIn: "5m" }) } };
  let next = false;
  await loadUser(req, response(), () => { next = true; });
  assert.equal(req.user, undefined);
  assert.equal(next, true);
});

test("logout clears stale cookies even without a refresh token", async () => {
  const res = response();
  await logout({ cookies: {}, flash() {} }, res);
  assert.deepEqual(res.cleared, ["refreshToken", "accessToken"]);
  assert.equal(res.redirected, "/");
});

test("app renders login, blocks foreign form posts, and handles missing pages", async t => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  t.after(() => new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const login = await fetch(base + "/auth/login");
  assert.equal(login.status, 200);
  assert.match(await login.text(), /<form/);
  const blocked = await fetch(base + "/auth/login", { method: "POST", headers: { origin: "https://evil.example" } });
  assert.equal(blocked.status, 403);
  assert.equal((await fetch(base + "/missing-page")).status, 404);
});
