const config = require('../config.json');
Object.keys(config.numerics).forEach(k => {
    if (k.endsWith("_seconds")) config.numerics[k] *= 1000
    else if (k.endsWith("_minutes")) config.numerics[k] *= 60 * 1000
    else if (k.endsWith("_hours")) config.numerics[k] *= 60 * 60 * 1000
    else if (k.endsWith("_days")) config.numerics[k] *= 24 * 60 * 60 * 1000
})

export default config;
