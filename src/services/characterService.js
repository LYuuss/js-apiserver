const { randomUUID } = require('node:crypto');
const Character = require('../models/Character');
const characterRepo = require('../repositories/characterRepository');

class CharacterService {
    constructor(filePath) {
        this.filePath = filePath;
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
        return characterRepo.fullUpdate(sub, data, this.filePath);
    }

    async modify(sub, params) {
        return characterRepo.partialUpdate(sub, params, this.filePath);
    }
}

module.exports = CharacterService;
