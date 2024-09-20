import {Router} from 'express';

import users from './users.js';
import chat from './chat.js';

const router = Router();

router.use('/users', users);
router.use('/chat', chat);

router.get('/chat', (req, res) => {
    res.render('chat');
});

export default router;