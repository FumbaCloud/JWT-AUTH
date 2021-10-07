const UserModel = require('../models/user-model')
const bcrypt = require('bcrypt')
const uuid = require('uuid')
const mailService = require('../services/mail-service')
const tokenService = require('../services/token-service')
const UserDto = require('../dtos/user-dtos')
const ApiError = require('../exceptions/api-error')

class UserService {
    async registration(email, password) {
        const candidate = await UserModel.findOne({email})

        if (candidate) {
            throw ApiError.BadRequest(`User with email ${email} already exist`)
        }

        const hashedPassword = await bcrypt.hash(password, 5)
        const activationLink = uuid.v4()

        const user = await UserModel.create({email, password: hashedPassword})

        //await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate${activationLink}`)

        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...user})

        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {
            ...tokens,
            user: userDto
        }
    }

    async activate(activationLink) {
        const user = await UserModel.findOne({
            activationLink
        })

        if (!user) {
            throw ApiError.BadRequest('Incorrect activation link')
        }

        user.isActivated = true

        await user.save()
    }

    async login(email, password) {
        const user = await UserModel.findOne({email})
        if (!user) {
            throw ApiError.BadRequest('User does not exist')
        }

        const isPasswordEqual = await bcrypt.compare(password, user.password)
        if (!isPasswordEqual) {
            throw ApiError.BadRequest('Password incorrect')
        }
        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...user})

        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {
            ...tokens,
            user: userDto
        }
    }

    async logout (refreshToken) {
        const token = await tokenService.removeToken(refreshToken)

        return token
    }

    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError()
        }

        const userData = tokenService.validateRefreshToken(refreshToken)

        const tokenFromDataBase = await tokenService.findToken(refreshToken)

        if (!userData || !tokenFromDataBase) {
            throw ApiError.UnauthorizedError()
        }

        const user = await UserModel.findById(userData.id)
        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...userDto})

        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {
            ...tokens,
            user: userDto
        }
    }

    async getAllUsers() {
        const users = UserModel.find()

        return users
    }

}

module.exports = new UserService()