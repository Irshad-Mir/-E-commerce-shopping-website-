const orderModel = require('../models/orderModel.js')
const cartModel = require('../models/cartModel.js')
const userModel = require('../models/userModel.js')
const mongoose = require('mongoose');

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

///Feature4 - API 1 Create Order
const createOrder = async function(req, res) {
    try {
        let userId = req.params.userId
        let requestBody = req.body
        let decodedId = req.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, Message: "Invalid user Id" })
        }

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, Message: "Invalid request params, body can't be empty" })
        }

        if (decodedId == userId) {

            //Extract Params
            let { cartId, cancellable, status } = requestBody

            if (!isValidObjectId(cartId)) {
                return res.status(400).send({ status: false, Message: "Invalid cart ID" })
            }

            let cartFind = await cartModel.findOne({ _id: cartId })

            if (!cartFind) {
                return res.status(404).send({ status: false, Message: "No cart found with provided cart ID" })
            }

            let noOfItems = cartFind.items.length

            let itemQuantity = 0
            for (let i = 0; i < cartFind.items.length; i++) {
                itemQuantity += cartFind.items[i].quantity
            }

            let orderDetails = {
                userId: userId,
                items: cartFind.items,
                totalPrice: cartFind.totalPrice,
                totalItems: noOfItems,
                totalQuantity: itemQuantity,
                cancellable: cancellable,
                status: status
            }

            let order = await orderModel.create(orderDetails)

            return res.status(201).send({ status: true, Message: "Order Placed Successfully", data: order })

        } else {
            res.status(401).send({ status: false, Message: "Unauthorized access" })
        }

    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}

//Feature 4 API 2================================================
const updateOrder = async function(req, res) {
    try {
        let userId = req.params.userId
        let requestBody = req.body
        let decodedId = req.userId

        if (!isValidObjectId(userId)) {
            return res.status(400).send({ status: false, Message: "Invalid user Id" })
        }

        if (!isValidRequestBody(requestBody)) {
            return res.status(400).send({ status: false, Message: "Invalid request params, body can't be empty" })
        }

        if (decodedId == userId) {

            const user = await userModel.findOne({ _id: userId, isDeleted: false });

            if (!user) {
                return res.status(404).send({ status: false, message: `user does not exit` })
            }
            //Extract Params
            const { status, orderId } = requestBody;

            if (!orderId) {
                return res.status(400).send({ status: false, message: "Order ID is required" })
            }

            if (!isValidObjectId(orderId)) {
                return res.status(400).send({ status: false, message: `Order ID Invalid` })
            }

            const order = await orderModel.findOne({ _id: orderId })

            if (!order) {
                return res.status(404).send({ status: false, message: `order does not exit` })
            }

            if (!status) {
                return res.status(400).send({ status: true, message: "Order status not changed", data: order })
            }

            if (order.cancellable == true) {
                if (order.status == "pending") {
                    const updatedOrder = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true })
                    return res.status(200).send({ status: true, message: "Order updated successfully", data: updatedOrder })
                }

                if (order.status == "completed" || order.status == "cancelled") {
                    if (status) {
                        return res.status(400).send({ status: true, message: "Order can't be updated as it is completed or cancelled" })
                    }
                }
            } else if (order.cancellable == false) {
                res.status(400).send({ Message: "This is not a cancellable order" })
            }
        } else {
            res.status(401).send({ status: false, Message: "Unauthorized access" })
        }

    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}
module.exports = { createOrder, updateOrder }