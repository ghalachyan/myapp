import {DataTypes, Model} from 'sequelize';
import sequelize from '../clients/sequelize.mysql.js';
import Users from "./Users.js";

class Followers extends Model {}

Followers.init(
    {
        id: {
            type: DataTypes.BIGINT.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
            allowNull: false,
        },

        followerId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        },

        followingId: {
            type: DataTypes.BIGINT.UNSIGNED,
            allowNull: false,
        }
    },
    {
        sequelize,
        modelName: 'follow',
        tableName: 'follow',
    }
)

Users.hasMany(Followers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    foreignKey: 'followerId',
    as: 'following',
});

Followers.belongsTo(Users, {
    foreignKey: 'followerId',
    as: 'follower',
});

Users.hasMany(Followers, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
    foreignKey: 'followingId',
    as: 'followers',
})

Followers.belongsTo(Users, {
    foreignKey: 'followingId',
    as: 'following',
});

export default Followers;