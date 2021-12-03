export type RunnerCallback = (isStopped: boolean) => Promise<void>;

export class Runner {
    private callback: RunnerCallback;
    private milliseconds: number;
    private timeout: NodeJS.Timeout | null = null
    private isStopped = false
    private callbackPromise: Promise<void> = Promise.resolve()

    public constructor(callback: RunnerCallback, milliseconds: number) {
        this.callback = callback;
        this.milliseconds = milliseconds;
    }

    public start() {
        this.isStopped = false
        this.run()
    }

    public async stop(): Promise<void> {
        this.isStopped = true
        if (this.timeout) {
            clearTimeout(this.timeout)
        }
        try {
            await this.callbackPromise
        } catch (err) {
            // Do nothing, it is the callback's responsibility to log/handle errors
        }
        return Promise.resolve()
    }

    private async run() {
        try {
            this.timeout = null
            this.callbackPromise = this.callback(this.isStopped)
            await this.callbackPromise
        } catch (error) {
            // Do nothing, it is the callback's responsibility to log/handle errors
        } finally {
            if (!this.isStopped) {
                this.timeout = setTimeout(this.run.bind(this), this.milliseconds)
            }
        }
    }
}