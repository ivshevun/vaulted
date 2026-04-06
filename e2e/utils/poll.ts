import { sleep } from './sleep';

export async function poll(
  condition: () => Promise<boolean>,
  { interval = 1000, timeout = 30000 } = {},
): Promise<void> {
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    if (await condition()) return;
    await sleep(interval);
  }

  throw new Error('poll: condition not met within timeout');
}
