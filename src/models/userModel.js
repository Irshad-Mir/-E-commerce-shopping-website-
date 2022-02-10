const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: true,
        trim: true
    },
    lname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        required: 'Email address is required',
        validate: {
            validator: function(email) {
                return /^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)
            },
            message: 'Please fill a valid email address',
            isAsync: false
        },
    },
    profileImage: {
        type: String,
        required: true,
        trim: true
    }, // s3 link
    phone: {
        type: String,
        unique: true,
        require: "mobile number is required",
        trim: true,
        validator: {
            validator: function(phone) {
                return /^(\+91[\-\s]?)?[0]?(91)?[789]\d{9}$/.test(phone);
            },
            message: 'Please fill a valid phone number',
            isAsync: false
        }
    },
    password: {
        type: String,
        unique: true,
        require: "password is required",
        trim: true,
        validator: {
            validator: function(password) {
                return /^[a-zA-Z0-9!@#$%^&*]{8,15}$/.test(password);
            },
            message: 'Please fill a valid password',
            isAsync: false
        }
    },
    address: {
        shipping: {
            street: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            pincode: {
                type: Number,
                required: true
            }
        },
        billing: {
            street: {
                type: String,
                required: true
            },
            city: {
                type: String,
                required: true
            },
            pincode: {
                type: Number,
                required: true
            }
        }
    },

}, { timestamps: true });
module.exports = mongoose.model("User", userSchema);