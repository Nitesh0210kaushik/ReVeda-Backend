import { BaseRepository } from './BaseRepository';
import Role, { IRole } from '../models/Role';

export class RoleRepository extends BaseRepository<IRole> {
    constructor() {
        super(Role);
    }

    async findByName(name: string): Promise<IRole | null> {
        return this.model.findOne({ name });
    }
}

export default new RoleRepository();
