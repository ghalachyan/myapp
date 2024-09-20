import jwt from "jsonwebtoken";
import {Server} from "socket.io";

import Users from "../models/Users.js";
import Messages from "../models/Messages.js";

const {JWT_TOKEN} = process.env;

class Socket {
    static init = (server) => {
        this.io = new Server(server);

        this.io.on('connection', this.handleConnection);
    }

    static handleConnection = async (client) => {
        console.log('a user connected');

        await this.authorize(client);

        client.on('disconnect', this.handleDisconnection);
        client.on('newMessage', this.handleNewMessage(client));
    }

    static authorize = async (client) => {
        const {headers} = client.handshake;
        const {authorization = ''} = headers;
        try {
            const decryptedData = jwt.verify(authorization, JWT_TOKEN);

            const user = await Users.findByPk(decryptedData.id, {raw: true});

            if (user) {
                client.join(`user:${user.id}`);

                client.userData = user;
            } else {
                client.userData = {}
            }

        } catch (e) {
            console.log(e);
            setTimeout(() => {
                client.emit('error', {message: e.message});
            }, 500);
        }
    }

    static handleNewMessage = (client) => async (msg) => {
        const {message, userId} = msg;

        await Messages.create({
            senderId: client.userData.id,
            receiverId: userId,
            message,
        });

        this.io.to(`user:${userId}`).emit('newMessage', {
            message,
            senderId: client.userData.id,
        });
    }

    static handleDisconnection = (client) => {
        console.log('user disconnected');
    }
}

export default Socket;
