
class Character {
    constructor({
        is_deity,
        sub,
        name,
        family_name,
        given_name,
        picture,
        updated_at,
        parent_subs = [],
        sibling_subs = [],
        love_subs = [],
        hate_subs = [],
        tutelary_deity_subs = [],
        strength,
        beauty,
        politics,
        vitality
    }) {
        if (typeof is_deity !== 'boolean') {
            throw new TypeError('is_deity must be a boolean');
        }

        if (typeof sub !== "string" || !sub.trim()) {
            throw new TypeError(
                "sub must be a non-empty string"
            );
        }

        if (typeof name !== "string" || !name.trim()) {
            throw new TypeError(
                "name must be a non-empty string"
            );
        }

        const relations = {
            parent_subs,
            sibling_subs,
            love_subs,
            hate_subs,
            tutelary_deity_subs
        };

        for (const [key, values] of Object.entries(relations)) {
            if (
                !Array.isArray(values) ||
                !values.every(
                    value => typeof value === "string" && value.trim()
                )
            ) {
                throw new TypeError(
                    `${key} must be an array of non-empty strings`
                );
            }
        }

        const borneMax = is_deity ? 100 : 60;

        const stats = {
            strength,
            beauty,
            politics,
            vitality
        };

        for (const [key, value] of Object.entries(stats)) {
            if (
                !Number.isFinite(value) ||
                value < 0 ||
                value > borneMax
            ) {
                throw new RangeError(
                    `${key} must be between 0 and ${borneMax}`
                );
            }
        }

        this.is_deity = is_deity;
        this.sub = sub;
        this.name = name;
        this.family_name = family_name;
        this.given_name = given_name;
        this.picture = picture;
        this.updated_at = updated_at;

        this.parent_subs = [...parent_subs];
        this.sibling_subs = [...sibling_subs];
        this.love_subs = [...love_subs];
        this.hate_subs = [...hate_subs];
        this.tutelary_deity_subs = [...tutelary_deity_subs];

        this.strength = strength;
        this.beauty = beauty;
        this.politics = politics;
        this.vitality = vitality;
    }
}

export default Character;
