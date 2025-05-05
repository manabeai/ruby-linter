import init, { add } from './pkg/ruby_linter_rs.js';

(async () => {
  await init();
  console.log(add(1n, 2n));
})();