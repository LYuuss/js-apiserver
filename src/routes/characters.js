var express = require('express');
var characterRepo = require('../repositories/characterRepository');

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

    return router;
}

module.exports = createCharactersRouter;