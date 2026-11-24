const  express = require('express');
const characterRepo = require('../repositories/characterRepository');
const Character = require('../models/Character');

function createCharactersRouter(filePath) {
    const router = express.Router();

    router.get('/:character_id', async (req, res) => {
        const character = await characterRepo.findBySub(
            req.params.character_id,
            filePath
        );

        if (character === null) {
            return res.status(404).json({
                error: 'Character not found'
            });
        }

        return res.json(character);
    });

    router.post('/', async (req, res) => {
        const data = req.body;

        try{   
            const character = new Character(data);

            const saved = await characterRepo.save(character, filePath);
            return res.status(201).json(saved);
        } 
        catch(error) {
            if(error.name === "TypeError" || error.name === "RangeError") {
                return res.status(400).json({
                    error: error.message
                });
            }
            if(error.message === 'Already exists'){
                return res.status(409).json({
                    error: "Character already exists"
                });
            }

            return next(error);
        }
    });

    return router;
}

module.exports = createCharactersRouter;