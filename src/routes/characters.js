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

    router.delete('/:character_id', async (req, res, next) => {
        const id = req.params.character_id;

        try {
            await characterRepo.remove(id, filePath);

            return res.status(204).end();

        } catch (error) {
            if (error.message === 'Character does not exist') {
                return res.status(404).json({
                    error: 'Character not found'
                });
            }

            return next(error);
        }
    });

    router.put('/:character_id', async(req, res, next) => {
        const id = req.params.character_id;
        const data = req.body;

        try{
            const character = new Character(data);
            const updated = await characterRepo.fullUpdate(id, character, filePath);
            return res.status(200).json(updated);
        } catch(error) {
            if(error.message === "Character does not exist"){
                return res.status(404).end();
            }
            
            return next(error);
        }
    });

    router.patch('/:character_id', async(req, res, next) => {
        const id = req.params.character_id;
        const data = req.body;

        try{
            const updated = await characterRepo.partialUpdate(id, data, filePath);
            return res.status(200).json(updated);
        } catch(error) {
            if(error.name === "TypeError" || error.name === "RangeError") {
                return res.status(400).json({
                    error: error.message
                });
            }
            if(error.message === "Already exist"){
                return res.status(404).json({
                    error: error.message
                });
            }
            if(error.message === "Character does not exist"){
                return res.status(404).end();
            }
            
            return next(error);
        }
    });

    return router;
}

module.exports = createCharactersRouter;