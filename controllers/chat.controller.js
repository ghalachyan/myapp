import {Op} from 'sequelize';

import Media from "../models/Media.js";
import Users from "../models/Users.js";
import Messages from '../models/Messages.js';
import Followers from "../models/Followers.js";

export default {
    async getChatMessages(req, res) {
        try {
            const {id} = req.user;
            const {userId} = req.query;

            const data = await Messages.findOne({
                where: {
                    [Op.or]: [
                        {senderId: userId, receiverId: id},
                        {senderId: id, receiverId: userId},
                    ],
                },
                raw: true,
            })

            if (!data) {
                res.status(404).json({message: 'Messages not found'});
                return;
            }
            res.status(200).json({
                messages: data,
            });

        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            });
        }
    },

    async getFollowers(req, res) {
        try {
            const {id: userId} = req.user;

            const limit = +5  //req.query.limit;
            const page = +1;  //req.query.page

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

            const userFollowers = await Users.findAll({
                include: [
                    {
                        model: Followers,
                        as: 'following',
                        attributes: ['followingId'],
                        where: {
                            followerId: userId,
                        }
                    },
                    {
                        model: Media,
                        as: 'avatar',
                        attributes: ['path'],
                    },
                ],
                limit,
                offset
            });

            if(!userFollowers) {
                res.status(404).json({
                    message: 'Followers does not found.',
                });
                return;
            }

            res.status(200).json({
                userFollowers
            })

        } catch (e) {
            res.status(500).json({
                message: 'Internal server error',
                error: e.message,
            });
        }
    },
}