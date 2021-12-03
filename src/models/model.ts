export abstract class Model {
    public createdOnUtc: Date;
    public updatedOnUtc: Date;

    public constructor() {
        this.createdOnUtc = new Date();
        this.updatedOnUtc = new Date();
    }
}