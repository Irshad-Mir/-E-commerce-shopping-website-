const mongoose = require('mongoose')
const aws = require("aws-sdk");
const productModel = require('../models/productModel')


const isValid = function(value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = function(requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function(objectId) {
    return mongoose.Types.ObjectId.isValid(objectId)
}

// AWS Fileupload -----------------------------------------------------------
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
        var uploadParams = {
            ACL: "public-read", // this file is publically readable
            Bucket: "classroom-training-bucket",
            Key: "Group7/" + file.originalname,
            Body: file.buffer,
        };

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

//API-1 Register Product
const registerProduct = async function(req, res) {
    try {

        requestBody = req.body
        let { title, description, price, currencyId, currencyFormat, style, availableSizes, installments, isFreeShipping } = requestBody;
        let files = req.files;
        if (!(files && files.length > 0)) {
            res.status(400).send({ status: false, msg: "Please upload product image" });
        } else {
            const productImage = await uploadFile(files[0]);
            let productData = { title, description, price, currencyId, currencyFormat, style, productImage, availableSizes, installments, isFreeShipping };
            let sizes = availableSizes.split(",").map(x => x.trim())
            for (let i = 0; i < sizes.length; i++) {
                console.log(sizes)
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(sizes[i]))) {
                    return res.status(400).send({ status: false, message: `availableSizes should be among ${["S", "XS", "M", "X", "L", "XXL", "XL"].join(', ')}` })
                }
            }
            if (Array.isArray(sizes)) {
                productData['availableSizes'] = sizes
            }
            productData['availableSizes'] = sizes
            let newProduct = await productModel.create(productData);
            res.status(201).send({ status: true, message: `products registered successfully`, data: newProduct });
        }
    } catch (error) {
        res.status(500).send({ status: false, Message: error.message })
    }
}

//API - 2 Get product by query filters
const productByQuery = async function(req, res) {

    try {
        let saveQuery = req.query;
        let { size, name, priceGreaterThan, priceLessThan } = saveQuery;
        if (size || name || priceGreaterThan || priceLessThan) {
            let body = { isDeleted: false };
            body.isDeleted = false

            if (size) {
                body.availableSizes = size
            }

            if (name) {
                name = name.trim()
                body.title = { $regex: name, $options: "$in" }
            }

            if (priceGreaterThan) {
                body.price = { $gt: priceGreaterThan }
            }

            if (priceLessThan) {
                body.price = { $lt: priceLessThan }
            }

            let getProduct = await productModel.find(body).sort({ price: 1 })
            if (!(getProduct.length > 0)) {
                return res.status(404).send({ status: false, message: " There is no such product, please valid query ", });
            }
            return res.status(200).send({ status: true, message: "Query Product list", data: getProduct, });
        } else {
            let productFound = await productModel.find()
            return res.status(200).send({ status: true, message: "All Products List", data: productFound });
        }
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
}


//API 3 Get Product by ID
const getProductById = async(req, res) => {
    try {
        let productId = req.params.productId
        let checkId = isValidObjectId(productId)
        if (!checkId) {
            return res.status(400).send({ status: false, message: "Please Provide a valid productId " });;
        }
        let productFound = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productFound) {
            return res.status(404).send({ status: false, msg: "There is no product with provided id" });
        }
        return res.status(200).send({ status: true, message: 'Product Details', data: productFound });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
}

//API 5- Delete product by ID
const deleteProductById = async(req, res) => {
    try {
        let productId = req.params.productId
        let checkId = isValidObjectId(productId)
        if (!checkId) {
            return res.status(400).send({ status: false, message: "Please Provide a valid productId " });;
        }
        let productFound = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!productFound) {
            return res.status(404).send({ status: false, msg: "No product found with provided ID" });
        }

        let deletedProduct = await productModel.findOneAndUpdate({ _id: productId, isDeleted: false }, { isDeleted: true, deletedAt: new Date() }, { new: true })
        return res.status(200).send({ status: true, message: 'Product Deleted Sucessfully', data: deletedProduct });
    } catch (err) {
        return res.status(500).send({ status: false, msg: err.message });
    }
}

const updateProductById = async function(req, res) {
    try {
        let pId = req.params.productId
        let checkId = isValidObjectId(pId);
        if (!checkId) {
            return res.status(400).send({ status: false, message: "Please Provide a valid productId in path params" });;
        }
        let productFound = await productModel.findOne({ _id: pId, isDeleted: false })
        if (!productFound) {
            return res.status(404).send({ status: false, msg: "There is no product exist with this id" });
        }
        let updateBody = req.body
        let { title, description, price, productImage, style, availableSizes, installments } = updateBody

        const duplicateTitle = await productModel.findOne({ title: title })
        if (duplicateTitle) {
            return res.status(400).send({ status: false, message: "This title is already exists with another product" });
        }
        let updateProduct = await productModel.findOneAndUpdate({ _id: pId }, { title: title, description: description, price: price, productImage: productImage, style: style, availableSizes: availableSizes, installments: installments }, { new: true })
        return res.status(200).send({ status: true, message: 'Product Updated successfully', data: updateProduct });
    } catch (err) {
        return res.status(500).send({ message: err.message });
    }
};




module.exports = { registerProduct, getProductById, deleteProductById, productByQuery, updateProductById }