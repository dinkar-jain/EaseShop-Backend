import jwt from "jsonwebtoken";

const getToken = (user) => {
    return jwt.sign(user.toJSON(), process.env.JWT_SECRET, {
        expiresIn: 86400
    })
}

const isAuth = (req, res, next) => {
    const Token = req.headers.authorization;
    if (Token) {
        jwt.verify(Token, process.env.JWT_SECRET, (err, decode) => {
            if (err) {
                return res.status(401).send({ msg: "Invalid Token" })
            }
            req.user = decode;
            next();
            return
        })
    }

    else {
        return res.status(401).send({ msg: "Token Is Not Supplied" })
    }
}

const isSeller = (req, res, next) => {
    if (req.user && req.user.isSeller) {
        return next();
    }
    return res.status(401).send({ msg: "Admin Token Is Not Valid" })
}

export { getToken, isAuth, isSeller }