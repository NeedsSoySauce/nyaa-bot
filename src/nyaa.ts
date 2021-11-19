import { URL, URLSearchParams } from 'url';
import { RssClient, BasicRssClient } from './rss.js';

export enum NyaaFilter {
    NoFilter,
    NoRemakes,
    TrustedOnly,
}

export enum NyaaCategory {
    AllCategories = '0_0',
    Anime = '1_0',
    AnimeMusicVideo = '1_1',
    AnimeEnglishTranslated = '1_2',
    AnimeNonEnglishTranslated = '1_3',
    AnimeRaw = '1_4',
    Audio = '2_0',
    AudioLossless = '2_1',
    AudioLossy = '2_2',
    Literature = '3_0',
    LiteratureEnglishTranslated = '3_1',
    LiteratureNonEnglishTranslated = '3_2',
    LiteratureRaw = '3_3',
    LiveAction = '4_0',
    LiveActionEnglishTranslated = '4_1',
    LiveActionIdolOrPromotionalVideo = '4_2',
    LiveActionNonEnglishTranslated = '4_3',
    LiveActionRaw = '4_4',
    Pictures = '5_0',
    PicturesGraphics = '5_1',
    PicturesPhotos = '5_2',
    Software = '6_0',
    SoftwareApplications = '6_1',
    SoftwareGames = '6_2',
}

export interface NyaaRssResponse {
    rss: {
        channel: NyaaRssChannel
    }
}

export interface NyaaRssChannel {
    title: string;
    description: string;
    link: string;
    "atom:link": string;
    item?: NyaaRssItem[];
}

export interface NyaaRssItem {
    title: string;
    link: string;
    guid: string;
    pubDate: string;
    "nyaa:seeders": number;
    "nyaa:leechers": number;
    "nyaa:downloads":number;
    "nyaa:infoHash": string;
    "nyaa:categoryId": NyaaCategory;
    "nyaa:category": string;
    "nyaa:size": string;
    "nyaa:comments": number;
    "nyaa:trusted": "Yes" | "No";
    "nyaa:remake": "Yes" | "No";
    description: string;
}

export interface NyaaSearchParameters {
    filter?: NyaaFilter;
    category?: NyaaCategory;
    query: string;
}

export interface NyaaConstructorParameters {
    baseUrl?: URL;
    defaultFilter?: NyaaFilter;
    defaultCategory?: NyaaCategory;
    rssClient?: RssClient;
}

export interface NyaaSearchResult {
    title: string;
    link: string;
    guid: string;
    pubDate: Date;
    "nyaaSeeders": number;
    "nyaaLeechers": number;
    "nyaaDownloads":number;
    "nyaaInfoHash": string;
    "nyaaCategoryId": NyaaCategory;
    "nyaaCategory": string;
    "nyaaSize": string;
    "nyaaComments": number;
    "nyaaTrusted": boolean;
    "nyaaRemake": boolean;
    description: string;
}

export class NyaaClient {
    private baseUrl = new URL('https://nyaa.si/');
    private defaultFilter = NyaaFilter.NoFilter;
    private defaultCategory = NyaaCategory.AllCategories;
    private rssClient: RssClient = new BasicRssClient();

    constructor(params: NyaaConstructorParameters = {}) {
        this.baseUrl = params.baseUrl ?? this.baseUrl;
        this.defaultFilter = params.defaultFilter ?? this.defaultFilter;
        this.defaultCategory = params.defaultCategory ?? this.defaultCategory;
        this.rssClient = params.rssClient ?? this.rssClient;
    }

    public mapRssResponse(response: NyaaRssResponse): NyaaSearchResult[] {
        return response.rss.channel.item?.map(item => ({
            title: item.title,
            link: item.link,
            guid: item.guid,
            pubDate: new Date(item.pubDate),
            "nyaaSeeders": item['nyaa:seeders'],
            "nyaaLeechers": item['nyaa:leechers'],
            "nyaaDownloads": item['nyaa:downloads'],
            "nyaaInfoHash": item['nyaa:infoHash'],
            "nyaaCategoryId": item['nyaa:categoryId'],
            "nyaaCategory": item['nyaa:category'],
            "nyaaSize": item['nyaa:size'],
            "nyaaComments": item['nyaa:comments'],
            "nyaaTrusted": item['nyaa:trusted'] === 'Yes',
            "nyaaRemake": item['nyaa:remake'] === 'Yes',
            description: "string"
        })) ?? []
    }

    public async search(params: NyaaSearchParameters): Promise<NyaaSearchResult[]> {
        const qs = new URLSearchParams({
            page: 'rss',
            q: params.query,
            f: (params.filter ?? this.defaultFilter).toString(),
            c: (params.category ?? this.defaultCategory).toString(),
        });

        const url = new URL(this.baseUrl.href);
        url.search = qs.toString();

        console.log(`${url}`)

        const response = await this.rssClient.get<NyaaRssResponse>(`${url}`);
        const results = this.mapRssResponse(response)
        return results;
    }
}
