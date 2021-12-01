import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import { RssClient } from '../src/services/rssClient.js';

export class MockRssClient implements RssClient {
    private mappings: Record<string, string>;

    public constructor(mappings: Record<string, string>) {
        this.mappings = Object.fromEntries(
            Object.entries(mappings).map(([url, filepath]) => [this.urlToKey(url), filepath]),
        );
    }

    private urlToKey(url: string) {
        const key = new URL(url);
        key.searchParams.sort();
        return key.toString();
    }

    public async get<T>(url: string): Promise<T> {
        const path = this.mappings[this.urlToKey(url)];

        if (!path) {
            throw Error(`No mapping found for url '${url}'`);
        }

        console.log(`'${url}' -> '${path}'`)

        const xml = fs.readFileSync(path).toString()

        const parser = new XMLParser();
        const data = parser.parse(xml);

        return data;
    }
}
