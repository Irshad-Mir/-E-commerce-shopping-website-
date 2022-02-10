const jwt = require('jsonwebtoken')
const userModel = require('../models/userModel')
const bcrypt = require('bcrypt')
const aws = require("aws-sdk");
const mongoose = require("mongoose")

const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true;
}
const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0
}
const isValidPassword = function(password) {
    if (password.length > 7 && password.length < 16)
        return true
}
const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

aws.config.update({
    accessKeyId: "AKIAY3L35MCRRMC6253G", // id
    secretAccessKey: "88NOFLHQrap/1G2LqUy9YkFbFRe/GNERsCyKvTZA", // like your secret password
    region: "ap-south-1", // Mumbai region
});
// this function uploads file to AWS and gives back the url for the file
let uploadFile = async(file) => {
    return new Promise(function(resolve, reject) {
        // Create S3 service object
        let s3 = new aws.S3({ apiVersion: "2006-03-01" });
        var uploadParams = { ACL: "public-read", Bucket: "classroom-training-bucket", Key: "Group7/" + file.originalname, Body: file.buffer, };
        // Callback
        s3.upload(uploadParams, function(err, data) {
            if (err) {
                return reject({ error: err });
            }
            console.log(data);
            console.log(`File uploaded successfully. ${data.Location}`);
            return resolve(data.Location);
        });
    });
};

//API 1 -  Register User
const registerUser = async function(req, res) {
    try {
        const requestBody = req.body;
        let { fname, lname, email, phone, password, address } = requestBody;
        let FPhone = phone.split(" ").join("");
        let FEmail = email.split(" ").join("");
        const encryptedPassword = await bcrypt.hash(password, 10);
        let files = req.files;
        if (!(files && files.length > 0)) {
            res.status(400).send({ status: false, msg: "Please upload profile image" });
        } else {
            const profileImage = await uploadFile(files[0]);
            const userData = {
                fname,
                lname,
                phone: FPhone,
                email: FEmail,
                password: encryptedPassword,
                address,
                profileImage: profileImage,
            };
            const newUser = await userModel.create(userData);
            res.status(201).send({ status: true, message: `User registered successfully`, data: newUser, });
        }
    } catch (error) {
        res.status(500).send({ status: false, Message: error.message });
    }
};

//API 2 - Login User===================================================================================================
const loginUser = async function(req, res) {
    try {
        const requestBody = req.body;

        // // Extract params
        const { email } = requestBody;
        const user = await userModel.findOne({ email });

        const token = await jwt.sign({
            userId: user._id,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12
        }, 'group7')

        res.status(200).send({ status: true, message: `user login successfull`, data: { token, userId: user._id } });
    } catch (error) {
        res.status(500).send({ status: false, message: error.message });
    }
}

//API 3 - Get User Details === === === === === === === === === === === === === === === === === === === === === === === === === === =

const getUserDetail = async(req, res) => {

    try {
        const userId = req.params.userId
        const decodedId = req.userId
        if (userId == decodedId) {
            const profileUser = await userModel.findOne({ _id: userId, isDeleted: false })
            if (!profileUser) {
                return res.status(404).send({ status: false, message: "user profile does not exist" });
            } else {
                return res.status(200).send({ status: true, message: 'user profile details', data: profileUser })
            }
        } else {
            res.status(401).send({ status: false, Message: "Incorrect User ID, please provide correct user ID" })
        }
    } catch (error) {
        return res.status(500).send({ success: false, error: error.message });
    }
}

// //API 4 - Update USER Details=========================================================================

const updateUserProfile = async(req, res) => {

    try {
        const userId = req.params.userId;
        const requestBody = req.body;
        const decodedId = req.userId;
        let files = req.files;

        if (!isValidRequestBody(requestBody)) {
            res.status(200).send({ status: false, Message: "No data updated. Details are unchanged" })
            return
        }

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
        }
        if (userId == decodedId) {
            let { fname, lname, email, password, address, phone } = requestBody;

            const userFind = await userModel.findById(userId)

            if (files && files.length > 0) {
                const profileImage = await uploadFile(files[0])
                userFind['profileImage'] = profileImage
            }

            if (fname) {
                if (!isValid(fname)) {
                    res.status(400).send({ status: false, Message: "Provide a valid fname" })
                }
                userFind['fname'] = fname
            }

            if (lname) {
                userFind['lname'] = lname
            }

            if (email) {
                if (!(/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/).test(email)) {
                    return res.status(400).send({ status: false, message: " Provide a valid email address" })
                }
                const isEmailAlreadyUsed = await userModel.findOne({ email: email });
                if (isEmailAlreadyUsed) {
                    return res.status(400).send({ status: false, message: `${email} email address is already registered` })
                }
                userFind['email'] = email
            }

            if (phone) {
                if (!(/^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/).test(phone)) {
                    return res.status(400).send({ status: false, message: " Provide a valid phone number" })
                }
                const isPhoneAlreadyUsed = await userModel.findOne({ phone: phone });
                if (isPhoneAlreadyUsed) {
                    return res.status(400).send({ status: false, message: `${phone} is already registered` })
                }
                userFind['phone'] = phone
            }

            if (password) {
                if (!isValidPassword(password)) {
                    return res.status(400).send({ status: false, message: `Password should be between 8-15 character` })
                }
                const encryptedPassword = await bcrypt.hash(password, 10);
                userFind['password'] = encryptedPassword
            }

            if (address) {
                if (isValid(address)) {
                    const shippingAddress = address.shipping
                    if (shippingAddress) {
                        if (shippingAddress.street)
                            userFind.address.shipping['street'] = shippingAddress.street
                        if (shippingAddress.city)
                            userFind.address.shipping['city'] = shippingAddress.city
                        if (shippingAddress.pincode)
                            userFind.address.shipping['pincode'] = shippingAddress.pincode
                    }
                }
            }
            if (address) {
                if (isValid(address)) {
                    const billingAddress = address.billing
                    if (billingAddress) {
                        if (billingAddress.street)
                            userFind.address.billing['street'] = billingAddress.street
                        if (billingAddress.city)
                            userFind.address.billing['city'] = billingAddress.city
                        if (billingAddress.pincode)
                            userFind.address.billing['pincode'] = billingAddress.pincode
                    }
                }
            }

            const updatedData = await userFind.save()

            return res.status(200).send({ status: true, Message: "Data Updated Successfully", data: updatedData })
        } else {
            res.status(401).send({ status: false, Messgae: "Incorrect user ID" })
        }
    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
};



module.exports = { registerUser, loginUser, getUserDetail, updateUserProfile }