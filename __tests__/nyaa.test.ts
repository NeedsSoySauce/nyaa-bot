import { NyaaClient } from '../src/services/nyaa.js';
import { MockRssClient } from './mocks.js';

describe('NyaaClient', () => {
    test('Default constructor works', () => {
        expect(() => new NyaaClient()).not.toThrowError();
    });

    test('Search returns the correct results', async () => {
        const rssClient = new MockRssClient({
            "https://nyaa.si/?page=rss&q=one+punch+man+1080p+season+1&c=0_0&f=0": "./__tests__/data/one punch man 1080p season 1.rss"
        })
        const client = new NyaaClient({ rssClient });
        const results = await client.search({
            query: 'one punch man 1080p season 1',
        });
        expect(results).toHaveLength(35);
    });
});
