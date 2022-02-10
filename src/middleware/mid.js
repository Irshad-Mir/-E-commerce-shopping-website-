const jwt = require("jsonwebtoken");
const userAuth = async function(req, res, next) {
    let token = req.header('Authorization');
    //  console.log(token)
    if (!token) return res.status(401).send({ status: false, Message: "Access Denied, Token missing" });
    try {
        if (token.startsWith('Bearer')) {
            // Remove Bearer from string
            token = token.slice(6, token.length).trimLeft();
            // console.log(token)
        }
        const verified = jwt.verify(token, "group7");
        req.userId = verified.userId;
        next();
    } catch (err) {
        res.status(400).send({ status: false, Message: "Invalid Token!!" });
    }
}
module.exports = { userAuth }

//Method 2---------------------------------------------------------------------------------------------
// const jwt = require("jsonwebtoken");
// const userAuth = async function(req, res, next) {
//     let token = req.header('Authorization');
//     // console.log(token)
//     if (!token) return res.status(401).send({ status: false, Message: "Access Denied, Token missing" });
//     try {
//         if (token) {
//             token = token.split(' ')
//             let requiredToken = token[1]
//             const verified = jwt.verify(requiredToken, "group7");
//             req.userId = verified.userId;
//             next();
//         }
//     } catch (err) {
//         res.status(400).send({ status: false, Message: "Invalid Token" });
//     }
// }
// module.exports = { userAuth }