import { URL, URLSearchParams } from 'url';
import { ArrayPager } from '../pager.js';
import { NullableUndefined, PagedResult } from '../types.js';
import { BasicRssClient, RssClient } from './rssClient.js';

export enum NyaaFilter {
    NoFilter,
    NoRemakes,
    TrustedOnly,
}

const nyaaFilterPairs: [NyaaFilter, string][] = [
    [NyaaFilter.NoFilter, "No Filter"],
    [NyaaFilter.NoRemakes,"No Remakes"],
    [NyaaFilter.TrustedOnly, "Trusted Only"]
]

export const NyaaFilterDisplayNames = new Map(nyaaFilterPairs)
export const ReverseNyaaFilterDisplayNames = new Map(nyaaFilterPairs.map(([k, v]) => [v, k]))

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

const nyaaCategoryPairs: [NyaaCategory, string][] =  [
    [NyaaCategory.AllCategories, "All Categories"],
    [NyaaCategory.Anime, "Anime"],
    [NyaaCategory.AnimeMusicVideo, "Anime - Music Video"],
    [NyaaCategory.AnimeEnglishTranslated, "Anime - English Translated"],
    [NyaaCategory.AnimeNonEnglishTranslated, "Anime - Non-English Translated"],
    [NyaaCategory.AnimeRaw, "Anime - Raw"],
    [NyaaCategory.Audio, "Audio"],
    [NyaaCategory.AudioLossless, "Audio - Lossless"],
    [NyaaCategory.AudioLossy, "Audio - Lossy"],
    [NyaaCategory.Literature, "Literature"],
    [NyaaCategory.LiteratureEnglishTranslated, "Literature - English Translated"],
    [NyaaCategory.LiteratureNonEnglishTranslated, "Literature - Non-English Translated"],
    [NyaaCategory.LiteratureRaw, "Literature - Raw"],
    [NyaaCategory.LiveAction, "Live Action"],
    [NyaaCategory.LiveActionEnglishTranslated, "Live Action - English Translated"],
    [NyaaCategory.LiveActionIdolOrPromotionalVideo, "Live Action - Idol/Promotion Video"],
    [NyaaCategory.LiveActionNonEnglishTranslated, "Live Action - Non-English Translated"],
    [NyaaCategory.LiveActionRaw, "Live Action - Raw"],
    [NyaaCategory.Pictures, "Pictures"],
    [NyaaCategory.PicturesGraphics, "Pictures - Graphics"],
    [NyaaCategory.PicturesPhotos, "Pictures - Photos"],
    [NyaaCategory.Software, "Software"],
    [NyaaCategory.SoftwareApplications, "Software - Applications"],
    [NyaaCategory.SoftwareGames, "Software - Games"],
]

export const NyaaCategoryDisplayNames = new Map(nyaaCategoryPairs)
export const ReverseNyaaCategoryDisplayNames = new Map(nyaaCategoryPairs.map(([k, v]) => [v, k]))

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

export interface NyaaSearchParameters extends NullableUndefined<{
    filter?: NyaaFilter;
    category?: NyaaCategory;
    query: string;
    user?: string;
    pageNumber?: number;
    pageSize?: number
}> {}

export interface NyaaConstructorParameters {
    baseUrl?: string;
    defaultFilter?: NyaaFilter;
    defaultCategory?: NyaaCategory;
    rssClient?: RssClient;
    trackersUrl?: string;
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

export interface NyaaSearchPagedResult extends PagedResult<NyaaSearchResult> {
    rssUrl: string;
    urL: string;
}

export class NyaaClient {
    private baseUrl = 'https://nyaa.si/';
    private defaultFilter = NyaaFilter.NoFilter;
    private defaultCategory = NyaaCategory.AllCategories;
    private rssClient: RssClient = new BasicRssClient();

    public constructor(params: NyaaConstructorParameters = {}) {
        this.baseUrl = params.baseUrl ?? this.baseUrl;
        this.defaultFilter = params.defaultFilter ?? this.defaultFilter;
        this.defaultCategory = params.defaultCategory ?? this.defaultCategory;
        this.rssClient = params.rssClient ?? this.rssClient;
    }

    private mapRssResponse(response: NyaaRssResponse): NyaaSearchResult[] {
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
            description: item.description
        })) ?? []
    }

    public async search(params: NyaaSearchParameters): Promise<NyaaSearchPagedResult> {
        const pageNumber = params.pageNumber ?? 0;
        const pageSize = params.pageSize ?? 10;

        const qs = new URLSearchParams({
            page: 'rss',
            q: params.query,
            f: (params.filter ?? this.defaultFilter).toString(),
            c: (params.category ?? this.defaultCategory).toString()
        });

        if (params.user) {
            qs.set('u', params.user)
        }

        const rssUrl = new URL(this.baseUrl);
        rssUrl.search = qs.toString();

        const url = new URL(rssUrl.href);
        url.searchParams.delete('page')

        const response = await this.rssClient.get<NyaaRssResponse>(`${rssUrl}`);
        const results = this.mapRssResponse(response)

        const pager = new ArrayPager(results, pageSize)
        const page = pager.getPage(pageNumber)

        return {
            ...page,
            rssUrl: rssUrl.toString(),
            urL: url.toString()
        };
    }
}
