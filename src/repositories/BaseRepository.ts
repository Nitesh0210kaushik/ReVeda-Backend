import { Model, Document, UpdateQuery, QueryOptions } from 'mongoose';
// FilterQuery might be missing in some versions or types packages, using any for broad compatibility
type FilterQuery<T> = any;

export abstract class BaseRepository<T extends Document> {
    constructor(protected readonly model: Model<T>) { }

    async create(data: Partial<T>): Promise<T> {
        return this.model.create(data);
    }

    async findOne(filter: FilterQuery<T>, projection?: any, options?: QueryOptions): Promise<T | null> {
        return this.model.findOne(filter, projection, options).exec();
    }

    async findById(id: string, projection?: any, options?: QueryOptions): Promise<T | null> {
        return this.model.findById(id, projection, options).exec();
    }

    async find(filter: FilterQuery<T> = {}, projection?: any, options?: QueryOptions): Promise<T[]> {
        return this.model.find(filter, projection, options).exec();
    }

    async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
        return this.model.findOneAndUpdate(filter, update, { new: true, ...options }).exec();
    }

    async updateById(id: string, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
        return this.model.findByIdAndUpdate(id, update, { new: true, ...options }).exec();
    }

    async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
        const result = await this.model.deleteOne(filter).exec();
        return result.deletedCount === 1;
    }

    async deleteById(id: string): Promise<boolean> {
        const result = await this.model.findByIdAndDelete(id).exec();
        return !!result;
    }
}
