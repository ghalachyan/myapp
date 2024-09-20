import fs from 'fs/promises';
import jwt from 'jsonwebtoken';
import {v4 as uuid} from 'uuid';

import {sendMail} from "../services/Mail.js";

import utils from "../utils/utils.js";

import Users from "../models/Users.js";
import Media from "../models/Media.js";
import Followers from "../models/Followers.js";

const {USER_PASSWORD_KEY} = process.env;

export default {
    async registration(req, res) {
        try {
            const {
                userName,
                email,
                password,
            } = req.body;

            const file = req.file;

            if (!file) {
                res.status(409).json({
                    message: 'File not found!'
                });
                return;
            }

            const [created, param2] = await Users.findOrCreate({
                where: {email: email.toLowerCase()},
                defaults: {
                    userName,
                    email: email.toLowerCase(),
                    password,

                },
            });

            const filePath = req.file ? req.file.path.replace('public/', '') : null;

            await Media.create({
                userId: created.id,
                path: filePath
            })

            if (!param2) {
                await fs.unlink(file.path);
                res.status(409).json({
                    message: 'Email already exists!'
                });
                return;
            }

            const result = await Users.findByPk(created.id, {
                include: [
                    {
                        model: Media,
                        as: 'avatar',
                        attributes: ['path']
                    }
                ]
            })

            const activationKey = uuid();

            await Users.update({
                activationKey,
            }, {
                where: {
                    id: created.id
                }
            })

            await sendMail({
                to: result.email,
                subject: 'Welcome to send mail project',
                template: 'userActivation',
                templateData: {
                    link: `http://localhost:3000/users/activate?key=${activationKey}`,
                }
            });

            res.status(201).json({
                message: 'User created successfully',
                result
            });
        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            });
        }
    },

    async activate(req, res) {
        try {
            const {key} = req.query;

            const user = await Users.findOne({
                where: {activationKey: key}
            });

            if (!user) {
                res.status(404).send({
                    message: 'User does not exist',
                });
                return;
            }

            if (user.status === 'active') {
                res.status(200).send({
                    message: 'User already activated',
                })
                return;
            }

            await Users.update({
                status: 'active',
            }, {
                where: {
                    id: user.id
                }
            })

            res.status(200).send({
                message: 'User activated successfully!',
            })

        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            })
        }
    },

    async login(req, res) {
        try {
            const {email, password} = req.body;
            const emailLowerCase = email.toLowerCase();

            const user = await Users.findOne({
                where: {email: emailLowerCase}
            });

            const hashPassword = Users.hash(password);

            if (!user || hashPassword !== user.getDataValue('password')) {
                res.status(401).json({
                    message: 'Invalid email or password',
                });
                return;
            }

            if (user.status !== 'active') {
                res.status(401).send({
                    message: 'Please confirm your email',
                });
                return;
            }
            const payload = {
                id: user.id,
                email: user.email,
            };

            const expiresIn = {
                expiresIn: '24h'
            };

            const token = utils.createToken(payload, expiresIn);

            if (user.role === 'admin') {
                res.status(200).json({
                    message: 'Login successfully',
                    token,
                    isAdmin: true
                });
                return;
            }

            res.status(200).json({
                message: 'Login successfully',
                token,
                isAdmin: false
            });

        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            });
        }
    },

    async profile(req, res) {
        try {
            const {id} = req.user;

            const user = await Users.findByPk(id, {
                include: [
                    {
                        model: Media,
                        as: 'avatar',
                        attributes: ['path']
                    },
                ],
            });

            if (!user) {
                res.status(404).json({
                    message: 'User not found',
                    user: []
                });
                return;
            }

            res.status(200).json({
                user
            })
        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            })
        }
    },

    async getUsers(req, res) {
        try {

            const page = +1;  //req.query.page
            const limit = +5  //req.query.limit;

            const total = Users.count();
            const offset = (page - 1) * limit;
            const maxPageCount = Math.ceil(total / limit);

            if (page > maxPageCount) {
                res.status(404).json({
                    message: 'Users does not found.',
                    users: []
                });

                return;
            }

            const data = await Users.findAll({
                limit,
                offset,
                order: [['createdAt', 'DESC']]
            });

            console.log(data)
            if (!data) {
                res.status(404).json({message: 'Users not found'});
                return;
            }

            res.status(200).json({
                usersList: data,
            });
        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            });
        }
    },

    async passwordRecovery(req, res) {
        try {
            const {email} = req.body;
            const user = await Users.findOne({
                where: {email}
            });
            if (!user) {
                res.status(404).json({message: 'User not found'});
                return;
            }

            const payload = jwt.sign(
                {id: user.id, email: user.email},
                USER_PASSWORD_KEY,
                {
                    expiresIn: '12h',
                }
            );

            await sendMail({
                to: user.email,
                subject: 'Update user password',
                template: 'userPassword',
                templateData: {
                    link: `http://localhost:3000/users/update/password?key=${payload}`
                }
            });

            res.status(200).json({
                message: 'Email sent successfully',
            })
        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            });
        }
    },

    async passwordUpdate(req, res) {
        try {
            const {password, duplicatePassword} = req.body;

            const {key} = req.query;

            if (!key) {
                res.status(400).json({
                    message: 'Token is required'
                });
                return;
            }

            const confirmedPassword = jwt.verify(key, USER_PASSWORD_KEY);

            if (!confirmedPassword) {
                res.status(401).json({
                    message: 'Invalid password key'
                });
                return;
            }

            if (password !== duplicatePassword) {
                res.status(400).json({
                    message: 'Password not found'
                })
            }

            await Users.update(
                {
                    password: duplicatePassword,
                },
                {
                    where: {
                        id: confirmedPassword.id
                    }
                }
            );

            res.status(200).json({
                message: 'Password updated successfully'
            })

        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            })
        }
    },

    async followUser(req, res) {
        try {
            const {id: userId} = req.user;
            const {followId} = req.params;

            if (userId === followId) {
                res.status(400).json({
                    message: 'Cannot track your own activity'
                });
                return;
            }

            const existingFollower = await Followers.findOne({
                where: {
                    followerId: userId,
                    followingId: followId
                }
            });

            if (existingFollower) {
                res.status(409).json({
                    message: 'You are currently following this user.'
                });
                return;
            }

            await Followers.create({
                followerId: userId,
                followingId: followId
            })

            res.status(200).json({
                message: 'Followed successfully'
            })
        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            })
        }
    },

    async unfollowUser(req, res) {
        try {
            const {id: userId} = req.user;
            const {followId} = req.params;

            const existingFollower = await Followers.findOne({
                where: {
                    followerId: userId,
                    followingId: followId
                }
            });

            if (!existingFollower) {
                res.status(404).json({
                    message: 'This user is not in your followers list.'
                });
                return;
            }

            await existingFollower.destroy();

            res.status(200).json({
                message: 'Unfollowed successfully'
            })
        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            })
        }
    }
}