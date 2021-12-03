import { XMLParser } from 'fast-xml-parser';
import fetch from 'node-fetch';

export interface RssClient {
    get<T>(url: string): Promise<T>;
}

export class BasicRssClient implements RssClient {
    public async get<T>(url: string): Promise<T> {
        const response = await fetch(url);
        const xml = await response.text();

        const parser = new XMLParser();
        const data = parser.parse(xml);

        return data;
    }
}
