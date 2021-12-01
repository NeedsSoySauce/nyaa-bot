import { promisify } from '../src/util';
import { Runner } from '../src/runner.js';
import { wait } from '../src/util.js';

describe('Runner', () => {
    test('Runs without error', () => {
        const callback = () => wait(50)
        expect(() => {
            const runner = new Runner(callback, 0)
            runner.start()
            runner.stop()
        }).not.toThrowError();
    });

    test('Handles error', () => {
        const callback = async () => {
            await wait(50)
            return Promise.reject()
        }
        expect(() => {
            const runner = new Runner(callback, 0)
            runner.start()
            runner.stop()
        }).not.toThrowError();
    });

    test('Runs callback multiple times', async () => {
        let count = 0
        const callback = promisify(() => { count += 1 })

        const run = async () => {
            const runner = new Runner(callback, 10)
            runner.start()
            await wait(100)
            await runner.stop()
        }

        await run()
        expect(count).toBeGreaterThan(1)
    })
});
