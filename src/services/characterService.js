import { randomUUID } from 'node:crypto';
import Character from '../models/Character';
import * as characterRepo from '../repositories/characterRepository';

class CharacterService {
    constructor(filePath) {
        this.filePath = filePath;
    }

    async getById(sub, filePath) {
        return characterRepo.findBySub(sub, filePath);
    }
    async create(data) {
        const character = new Character({
            ...data,
            sub: randomUUID()
        });

        return characterRepo.save(character, this.filePath);
    }
    
    async erase(sub){
        return characterRepo.remove(sub, this.filePath);
    }
    
    async replace(sub, data) {
        const character = new Character({
            ...data,
            sub
        });

        return characterRepo.fullUpdate(
            sub,
            character,
            this.filePath
        );
    }

    async modify(sub, params) {
        return characterRepo.partialUpdate(
            sub, 
            params, 
            this.filePath);
    }
}

export default CharacterService;
