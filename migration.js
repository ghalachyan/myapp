import Users from './models/Users.js';
import Media from './models/Media.js';
import Followers from './models/Followers.js';
import Messages from './models/Messages.js';

const models = [
    Users,
    Media,
    Followers,
    Messages
];

(async () => {
    for (const model of models) {
        await model.sync({ alter: true });
        console.log(`${model.name} table created or updated`);
    }
})()
