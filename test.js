import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 100, // ← 100人同時アクセス
  iterations: 50000, // 合計リクエスト数（500回×100人）
  thresholds: {
    http_req_failed: ['rate<0.05'], // 失敗率5%未満
    http_req_duration: ['p(95)<1000'], // 95%が1秒以内
  },
};

export default function () {
  const baseURL = 'https://ncoin-production.up.railway.app';

  // ランダムユーザー名生成
  const userA = `user${Math.floor(Math.random() * 50)}`;
  const userB = `user${Math.floor(Math.random() * 50)}`;

  // ランダム送金額
  const amount = Math.floor(Math.random() * 50) + 1;

  // 送金リクエスト
  const res = http.post(`${baseURL}/send`, JSON.stringify({
    from: userA,
    to: userB,
    amount,
  }), { headers: { 'Content-Type': 'application/json' }});

  check(res, {
    'status is 200 or 400': (r) => [200, 400].includes(r.status),
  });

  sleep(0.1);
}
