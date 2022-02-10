const express = require('express');
const userController = require('../controllers/userController.js')
const productController = require('../controllers/productController.js')
const cartController = require('../controllers/cartController.js')
const orderController = require('../controllers/orderController.js')

const mid = require('../middleware/mid.js')
const validator = require('../validator/validator.js')
const router = express.Router();
module.exports = router;



//User Routes
router.post("/register", validator.vUser, userController.registerUser)
router.post("/login", validator.validLogin, userController.loginUser)
router.get("/user/:userId/profile", mid.userAuth, userController.getUserDetail)
router.put("/user/:userId/profile", mid.userAuth, userController.updateUserProfile)

//Product Routes
router.post("/products", validator.vProduct, productController.registerProduct)
router.get("/products/:productId", productController.getProductById)
router.delete("/products/:productId", productController.deleteProductById)
router.get("/products", productController.productByQuery)
router.put("/products/:productId", productController.updateProductById)

//Cart Routes
router.post("/users/:userId/cart", mid.userAuth, cartController.createCart)
router.get("/users/:userId/cart", mid.userAuth, cartController.getCart)
router.delete("/users/:userId/cart", mid.userAuth, cartController.cartDelete)
router.put("/users/:userId/cart", mid.userAuth, cartController.updateCart)

//Order Routes
router.post("/users/:userId/orders", mid.userAuth, orderController.createOrder)
router.put("/users/:userId/orders", mid.userAuth, orderController.updateOrder)