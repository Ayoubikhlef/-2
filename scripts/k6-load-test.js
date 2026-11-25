// Load smoke test for the storefront. Run with:
//   k6 run scripts/k6-load-test.js
// Target another origin with:  TARGET=https://example.com k6 run scripts/k6-load-test.js
// The default stages ramp to 200 virtual users from ONE machine; the local
// network saturates before the CDN does, so read the latency tail with that in
// mind. A status-0 error with an `wsarecv` message is a local TCP timeout.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const failedChecks = new Rate('failed_checks');
const TARGET = __ENV.TARGET || 'https://aos-tech.store/';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],
    // 200 VUs from one consumer connection add several seconds of tail latency.
    http_req_duration: ['p(95)<3000'],
    failed_checks: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(TARGET, { tags: { endpoint: 'home' } });
  const ok = check(res, {
    'status is 200': (r) => r.status === 200,
    'storefront html': (r) => (r.body || '').includes('AOS Tech Store'),
  });
  failedChecks.add(!ok);
  sleep(1);
}
