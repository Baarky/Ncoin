import http from "k6/http";

export let options = {
  stages: [
    { duration: "30s", target: 10 },
    { duration: "30s", target: 50 },
    { duration: "30s", target: 100 },
  ],
};

export default function () {
  http.get("https://ncoin-production.up.railway.app/dashboard");
}
