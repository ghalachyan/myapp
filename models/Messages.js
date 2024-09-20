import {DataTypes, Model} from "sequelize";
import sequelize from "../clients/sequelize.mysql.js";

import Users from "./Users.js";

class Messages extends Model {
}

Messages.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },

        senderId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },

        receiverId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },

        message: {
            type: DataTypes.TEXT,
        }
    },
    {
        sequelize,
        modelName: 'messages',
        tableName: 'messages',
        timestamps: true,
    }
)

Users.hasMany(Messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    foreignKey: 'senderId',
    as: 'sender',
});

Messages.belongsTo(Users, {
    foreignKey: 'senderId',
    as: 'sender',
});

Users.hasMany(Messages, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    foreignKey: 'receiverId',
    as: 'receiver',
})

Messages.belongsTo(Users, {
    foreignKey: 'receiverId',
    as: 'receiver',
});

export default Messages;