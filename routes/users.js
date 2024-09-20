import {Router} from 'express';
import usersSchema from '../schemas/users.js';
import validate from '../middleware/validate.js';
import uploadFile from "../middleware/uploadFile.js";
import checkToken from "../middleware/checkToken.js";
import controller from '../controllers/users.controller.js';

const router = Router();

router.get('/registration', (req, res) => {
    res.render('registration');
});

router.get('/login', (req, res) => {
    res.render('login');
});

router.post(
    '/registration',
    uploadFile('public/avatar').single('avatar'),
    validate(usersSchema.registration, 'body'),
    controller.registration
);

router.get(
    '/activate',
    validate(usersSchema.activate, 'query'),
    controller.activate
)

router.post(
    '/login',
    validate(usersSchema.login, 'body'),
    controller.login
);

router.get(
    '/profile',
    checkToken,
    controller.profile
);

router.get(
    '/list',
    checkToken,
    controller.getUsers
);

router.post(
    '/recovery/password',
    checkToken,
    controller.passwordRecovery
)

router.put(
    '/update/password',
    checkToken,
    validate(usersSchema.updatePassword, 'body'),
    controller.passwordUpdate
)

router.post(
    '/follow/:followId',
    checkToken,
    validate(usersSchema.follow, 'params'),
    controller.followUser
)

router.delete(
    '/unfollow/:followId',
    checkToken,
    validate(usersSchema.unfollow, 'params'),
    controller.unfollowUser
)

export default router;