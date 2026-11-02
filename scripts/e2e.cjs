/**
 * Végpontok közötti (e2e) regressziós teszt a PigeonPost backendhez.
 *
 * FIGYELEM: adatot ír és módosít, ezért CSAK helyi, eldobható MongoDB ellen fut
 * (a script megtagadja a nem localhost/127.0.0.1 MONGODB_URI-t).
 *
 * Futtatás (két külön terminálban, ugyanazzal az env-vel):
 *   export MONGODB_URI=mongodb://127.0.0.1:27017/pigeonpost_test JWT_SECRET=testsecret \
 *          ADMIN_SECRET=adminsecret CRON_SECRET=cronsecret DISABLE_INTERNAL_FLIGHT_RUNNER=true
 *   npm run build && npx next start -p 3918        # 1. terminál
 *   npm run test:e2e                                # 2. terminál (üres adatbázis kell)
 * Ha nincs helyi MongoDB: `npx mongodb-memory-server`-es ideiglenes példány is megfelel.
 */
const mongoose = require('mongoose');
const crypto = require('crypto');
if (!/^mongodb:\/\/(127\.0\.0\.1|localhost)[:/]/.test(process.env.MONGODB_URI || '')) {
  console.error('Megtagadva: az e2e teszt csak helyi MongoDB-n (localhost/127.0.0.1) futhat.');
  process.exit(3);
}
const B = (process.env.E2E_BASE_URL || 'http://localhost:3918') + '/api';
const ADMIN = { Authorization: `Bearer ${process.env.ADMIN_SECRET || 'adminsecret'}`, 'Content-Type': 'application/json' };
let pass = 0, fail = 0;
const check = (name, ok, extra = '') => { (ok ? pass++ : fail++); console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : extra); };
const j = async (method, path, body, headers = {}) => {
  const r = await fetch(B + path, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await r.json(); } catch {}
  return { status: r.status, data };
};
(async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  // regisztráció + login
  let r = await j('POST', '/auth/register', { username: 'alice', email: 'alice@example.com', password: 'secret1' });
  check('register alice', r.status === 201, JSON.stringify(r));
  r = await j('POST', '/auth/register', { username: 'bob', email: 'bob@example.com', password: 'secret2' });
  check('register bob', r.status === 201);
  r = await j('POST', '/auth/register', { username: 'ALICE', email: 'x@example.com', password: 'secret1' });
  check('duplicate username (case-insens) -> 409', r.status === 409);
  r = await j('POST', '/auth/login', { usernameOrEmail: 'alice', password: 'secret1' });
  check('login has token+refreshToken', r.status === 200 && r.data.token && r.data.refreshToken);
  const alice = r.data;
  r = await j('POST', '/auth/login', { usernameOrEmail: 'bob', password: 'secret2' });
  const bob = r.data; const bobId = bob.user.id;
  r = await j('POST', '/auth/login', { usernameOrEmail: '(a+)+$', password: 'whatever' });
  check('regex-injection login -> 401 (nem 500)', r.status === 401);
  // refresh rotáció
  r = await j('POST', '/auth/refresh', { refreshToken: alice.refreshToken });
  check('refresh ok + rotated', r.status === 200 && r.data.refreshToken && r.data.refreshToken !== alice.refreshToken);
  const alice2 = r.data;
  r = await j('POST', '/auth/refresh', { refreshToken: alice.refreshToken });
  check('old refresh token rejected -> 401', r.status === 401);
  // auth-os végpont az új tokennel
  const A = { Authorization: 'Bearer ' + alice2.token }; const Bh = { Authorization: 'Bearer ' + bob.token };
  r = await j('GET', '/users/me', null, A);
  check('GET /users/me with refreshed token', r.status === 200, JSON.stringify(r));
  // push token + dedupe
  const pt = 'ExponentPushToken[abc123]';
  r = await j('POST', '/user/push-token', { pushToken: pt }, A); check('push-token alice', r.status === 200, JSON.stringify(r));
  r = await j('POST', '/user/push-token', { pushToken: pt }, Bh); check('push-token bob (same device)', r.status === 200);
  const aliceDoc = await db.collection('users').findOne({ username: 'alice' });
  check('token moved off alice', !aliceDoc.expoPushToken);
  r = await j('POST', '/user/push-token', { pushToken: 'nem-token' }, A); check('invalid push token -> 400', r.status === 400);
  r = await j('DELETE', '/user/push-token', null, Bh); check('DELETE push-token', r.status === 200);
  // notification settings
  r = await j('GET', '/user/notification-settings', null, A); check('GET notif settings defaults', r.status === 200 && r.data.enabled === true, JSON.stringify(r));
  const ns = { enabled: true, quietHours: { enabled: true, startHour: 23, endHour: 6, tzOffsetMinutes: 60 } };
  r = await j('PUT', '/user/notification-settings', ns, A); check('PUT notif settings', r.status === 200);
  r = await j('GET', '/user/notification-settings', null, A); check('notif settings persisted', r.data.quietHours.startHour === 23 && r.data.quietHours.enabled === true, JSON.stringify(r.data));
  r = await j('PUT', '/user/notification-settings', { enabled: 'x' }, A); check('invalid notif settings -> 400', r.status === 400);
  // admin
  r = await j('POST', '/admin/users/seeds', { userId: bobId, amount: 25 }); check('admin seeds w/o auth -> 401', r.status === 401);
  r = await fetch(B + '/admin/users/seeds', { method: 'POST', headers: ADMIN, body: JSON.stringify({ userId: bobId, amount: 25 }) }).then(async x => ({ status: x.status, data: await x.json() }));
  check('admin add seeds', r.status === 200 && r.data.newSeeds === 75, JSON.stringify(r));
  r = await fetch(B + '/admin/users/seeds', { method: 'POST', headers: ADMIN, body: JSON.stringify({ userId: bobId, amount: 10.5 }) }).then(async x => ({ status: x.status, data: await x.json() }));
  check('admin seeds decimal -> 400 with message', r.status === 400 && /egész/.test(r.data.error), JSON.stringify(r));
  await db.collection('users').updateOne({ username: 'bob' }, { $set: { inventory: null } });
  r = await fetch(B + '/admin/users/seeds', { method: 'POST', headers: ADMIN, body: JSON.stringify({ userId: bobId, amount: 5 }) }).then(async x => ({ status: x.status, data: await x.json() }));
  check('admin seeds with null inventory works', r.status === 200 && r.data.newSeeds === 5, JSON.stringify(r));
  // rangsor
  await db.collection('users').updateOne({ username: 'alice' }, { $set: { 'stats.maxDistance': 900 } });
  await db.collection('users').updateOne({ username: 'bob' }, { $set: { 'stats.maxDistance': 400 } });
  r = await j('GET', '/leaderboard?type=distance', null, Bh);
  check('leaderboard order + my rank', r.status === 200 && r.data.entries[0].username === 'alice' && r.data.me.rank === 2, JSON.stringify(r.data));
  r = await j('GET', '/leaderboard?type=nope', null, Bh); check('leaderboard bad type -> 400', r.status === 400);
  // jelentés
  const aliceId = aliceDoc._id.toString();
  r = await j('POST', '/reports', { targetUserId: aliceId, reason: 'spam', details: 'reklám' }, Bh); check('report alice', r.status === 201, JSON.stringify(r));
  r = await j('POST', '/reports', { targetUserId: bobId, reason: 'spam' }, Bh); check('self-report -> 400', r.status === 400);
  r = await j('POST', '/reports', { targetUserId: aliceId, reason: 'spam' }, Bh);
  check('duplicate report no new doc', (await db.collection('reports').countDocuments({})) === 1);
  r = await fetch(B + '/admin/reports', { headers: ADMIN }).then(async x => ({ status: x.status, data: await x.json() }));
  check('admin lists open report w/ populated names', r.status === 200 && r.data.length === 1 && r.data[0].targetUserId.username === 'alice' && r.data[0].reporterId.username === 'bob', JSON.stringify(r));
  const repId = r.data[0]._id;
  r = await fetch(B + '/admin/reports', { method: 'PATCH', headers: ADMIN, body: JSON.stringify({ id: repId, action: 'ban', note: 'spam' }) }).then(async x => ({ status: x.status }));
  check('admin ban via report', r.status === 200);
  r = await j('POST', '/auth/login', { usernameOrEmail: 'alice', password: 'secret1' }); check('banned alice login -> 403', r.status === 403, JSON.stringify(r));
  r = await j('POST', '/auth/refresh', { refreshToken: alice2.refreshToken }); check('banned alice refresh -> 401/403', r.status === 401 || r.status === 403, JSON.stringify(r));
  r = await j('GET', '/leaderboard?type=distance', null, Bh); check('banned user hidden from leaderboard', !r.data.entries.some(e => e.username === 'alice'));
  r = await fetch(B + '/admin/users/status', { method: 'POST', headers: ADMIN, body: JSON.stringify({ userId: aliceId, status: 'active' }) }).then(async x => ({ status: x.status }));
  r = await j('POST', '/auth/login', { usernameOrEmail: 'alice', password: 'secret1' }); check('unbanned alice can login', r.status === 200);
  // jelszó-visszaállítás
  r = await j('POST', '/auth/forgot-password', { email: 'alice@example.com' }); check('forgot-password generic 200', r.status === 200, JSON.stringify(r));
  r = await j('POST', '/auth/forgot-password', { email: 'nobody@example.com' }); check('forgot-password unknown email same 200', r.status === 200);
  const withReset = await db.collection('users').findOne({ username: 'alice' });
  check('reset code stored hashed w/ expiry', withReset.passwordReset && withReset.passwordReset.codeHash.length === 64 && withReset.passwordReset.expiresAt > new Date());
  // ismert kódra cseréljük a hash-t
  const code = '123456';
  await db.collection('users').updateOne({ _id: withReset._id }, { $set: { 'passwordReset.codeHash': crypto.createHash('sha256').update(`${aliceId}:${code}`).digest('hex') } });
  r = await j('POST', '/auth/reset-password', { email: 'alice@example.com', code: '000000', newPassword: 'newpass1' }); check('wrong code -> 400', r.status === 400);
  r = await j('POST', '/auth/reset-password', { email: 'alice@example.com', code, newPassword: 'newpass1' }); check('correct code resets pw', r.status === 200, JSON.stringify(r));
  r = await j('POST', '/auth/login', { usernameOrEmail: 'alice', password: 'newpass1' }); check('login with new password', r.status === 200);
  r = await j('POST', '/auth/login', { usernameOrEmail: 'alice', password: 'secret1' }); check('old password rejected', r.status === 401);
  r = await j('POST', '/auth/reset-password', { email: 'alice@example.com', code, newPassword: 'again123' }); check('code single-use', r.status === 400);
  // kliens hiba
  r = await j('POST', '/client-errors', { message: 'TypeError: x is undefined', isFatal: true, platform: 'android' }); check('client-errors accepted', r.status === 202, JSON.stringify(r));
  check('client error logged', (await db.collection('logs').countDocuments({ context: 'Mobil' })) === 1);
  // cron védelem
  r = await j('GET', '/cron/check-flights'); check('cron w/o secret -> 401', r.status === 401);
  r = await j('GET', '/cron/check-flights', null, { Authorization: `Bearer ${process.env.CRON_SECRET || 'cronsecret'}` }); check('cron with secret -> 200 (+reminders)', r.status === 200 && 'reminders' in r.data, JSON.stringify(r));
  // gamble atomi: két párhuzamos pörgetés
  r = await j('POST', '/auth/login', { usernameOrEmail: 'bob', password: 'secret2' });
  const Bt = { Authorization: 'Bearer ' + r.data.token };
  const res = await Promise.all([j('POST', '/economy/gamble', {}, Bt), j('POST', '/economy/gamble', {}, Bt), j('POST', '/economy/gamble', {}, Bt)]);
  check('3 parallel gambles -> exactly 1 success', res.filter(x => x.status === 200).length === 1, JSON.stringify(res.map(x => x.status)));
  console.log(`\n${pass} pass, ${fail} fail`);
  await mongoose.disconnect();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('E2E crash', e); process.exit(2); });
