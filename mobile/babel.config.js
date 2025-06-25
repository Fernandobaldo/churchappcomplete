module.exports = function (api) {
    api.cache(true);
    return {
        presets: [
            ['babel-preset-expo', {
                unstable_transformImportMeta: true, // Permite uso de import.meta com Hermes
            }],
        ],
        plugins: [],
    };
};
