import http from "k6/http";
import { sleep } from "k6";

export const options = {
  vus: 100,          // 仮想ユーザー50人
  iterations: 25000, // 合計リクエスト回数（1人500回）
  thresholds: {
    http_req_failed: ["rate<0.05"], // 失敗率5%未満を目標
    http_req_duration: ["p(95)<1000"], // 95%のリクエストが1秒以内
  },
};

export default function () {
  // 各仮想ユーザーに個別の名前を割り当て
  const userId = `user${String(__VU).padStart(2, "0")}`;

  const url = "https://ncoin-production.up.railway.app/quest";
  const payload = JSON.stringify({
    nickname: userId,
    amount: 10,
  });

  const params = { headers: { "Content-Type": "application/json" } };

  http.post(url, payload, params);
  sleep(0.2); // 少し間隔を空ける（負荷を現実的に）
}
