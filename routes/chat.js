import {Router} from 'express';

import controller from '../controllers/chat.controller.js';
import checkToken from "../middleware/checkToken.js";

const router = Router();

router.get('/messages',checkToken, controller.getChatMessages);
router.get('/clients',checkToken, controller.getFollowers);

export default router;