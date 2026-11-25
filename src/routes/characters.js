const  express = require('express');
const characterRepo = require('../repositories/characterRepository');
const Character = require('../models/Character');

const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024
    }
});

const CharacterService = require('../services/characterService');


function normalizeMultipartBody(body) {
    const data = { ...body };

    const numericFields = [
        'strength',
        'beauty',
        'politics',
        'vitality'
    ];

    if (typeof data.is_deity === 'string') {
        if (data.is_deity === 'true') {
            data.is_deity = true;
        } else if (data.is_deity === 'false') {
            data.is_deity = false;
        }
    }

    for (const field of numericFields) {
        if (typeof data[field] === 'string') {
            data[field] = data[field].trim() === ''
                ? NaN
                : Number(data[field]);
        }
    }

    return data;
};

function createCharactersRouter(filePath) {
    const router = express.Router();
    const characterService = new CharacterService(filePath);

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

    router.post('/', upload.single('picture'), async (req, res) => {

        try{   
            const data = req.is('multipart/form-data')
                ? normalizeMultipartBody(req.body)
                : req.body;

            const saved = await characterService.create(data, filePath);

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
            await characterService.erase(id, filePath);

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
            const updated = await characterService.replace(id, character, filePath);
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
            const updated = await characterService.modify(id, data, filePath);
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