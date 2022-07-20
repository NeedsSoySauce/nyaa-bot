import { Watch } from '../models/watch.js';
import { Runner } from '../runner.js';
import { NyaaNotificationService } from './commandClient';
import { NyaaClient, NyaaSearchResult } from './nyaaClient.js';
import { UserRepository } from './userRepository.js';
import { WatchRepository } from './watchRepository.js';

export interface NyaaWatcherConstructorParameters {
    nyaaClient: NyaaClient;
    nyaaNotificationService: NyaaNotificationService,
    watchRepository: WatchRepository;
    userRepository: UserRepository;
    milliseconds?: number
}

export class NyaaWatcher {
    private nyaaClient: NyaaClient;
    private nyaaNotificationService: NyaaNotificationService;
    private watchRepository: WatchRepository;
    private userRepository: UserRepository;
    private milliseconds: number
    private runner: Runner

    public constructor({ nyaaClient, nyaaNotificationService, watchRepository, userRepository, milliseconds }: NyaaWatcherConstructorParameters ) {
        this.nyaaClient = nyaaClient;
        this.nyaaNotificationService = nyaaNotificationService;
        this.watchRepository = watchRepository;
        this.userRepository = userRepository;
        this.milliseconds = milliseconds ?? 60 * 60 * 1000 * 0.5 // 30 minutes
        this.runner = new Runner(this.checkWatches.bind(this), this.milliseconds)
    }

    public start() {
        this.runner.start()
    }

    public async stop() {
        this.runner.stop()
    }

    private async getNewResults(watch: Watch): Promise<[Watch, NyaaSearchResult[]]> {
        const params = { ...watch, pageSize: 10, pageNumber: 0 }
        const items: NyaaSearchResult[] = []
        let index = -1

        try {
            while (index === -1) {
                    // eslint-disable-next-line no-await-in-loop
                    const page = await this.nyaaClient.search(params)
                    index = page.items.findIndex(item => watch.infoHashes.includes(item.nyaaInfoHash))
                    const slice = index === -1 ? page.items : page.items.slice(0, index)
                    items.push(...slice)
                    params.pageNumber += 1;
                    if (!page.hasNext) break;
            }
        } catch (e) {
            console.error(e)
        }

        return [watch, items];
    }

    private async checkWatches() {
        // TODO refactor if/when needed
        /* eslint-disable no-await-in-loop */
        try {
            const userIds = await this.userRepository.getUserIds()

            for (const userId of userIds) {
                const params = {
                    pageNumber: 0,
                    pageSize: 100,
                    userId
                }

                const changes: [Watch, NyaaSearchResult[]][] = []

                let hasNext = true
                while (hasNext) {
                    const watches = await this.watchRepository.getWatches(params)
                    const promises = watches.items.map(watch => this.getNewResults(watch))
                    const results = await Promise.all(promises)
                    changes.push(...results.filter(r => r[1].length > 0))
                    params.pageNumber += 1
                    hasNext = watches.hasNext
                }

                const promises: Promise<unknown>[] = changes.map(([watch, results]) => {
                    const infoHashes = [...watch.infoHashes, ...results.map(result => result.nyaaInfoHash)]
                    return this.watchRepository.addOrUpdateWatch({ ...watch, infoHashes })
                })

                const notificationPromise = this.nyaaNotificationService.notifyWatchChanged(userId, changes)
                promises.push(notificationPromise)

                await Promise.all(promises)
            }
        } catch (e) {
            console.error(e)
        }
        /* eslint-enable no-await-in-loop */
    }
}