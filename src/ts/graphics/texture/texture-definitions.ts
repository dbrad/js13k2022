type TextureDefinition = [number, number[], number, number, number, number];

export let texture_definitions: TextureDefinition[] = [
    [TEXTURE_TYPE_SPRITE, [TEXTURE_SINGLE_WHITE_PIXEL], 2, 1, 1, 1],
    [TEXTURE_TYPE_FONT, [FONT_NORMAL], 0, 0, 8, 8],
    [TEXTURE_TYPE_FONT, [FONT_SMALL], 0, 8, 5, 5],
    [TEXTURE_TYPE_SPRITE_STRIP,
        [TEXTURE_WHITE_CIRCLE, TEXTURE_D_PAD],
        0, 16, 16, 16],
];
