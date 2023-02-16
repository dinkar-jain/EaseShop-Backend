// Payment And Price Security
// Remove Order Items

import { getToken, isSeller, isAuth } from "./Middleware.js";
import { Users, Product, Order } from "./Model.js";
import bodyParser from "body-parser";
import Mongoose from "mongoose";
import Express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import Stripe from "stripe";
import cors from "cors";

dotenv.config();

const MONGODB_URL = process.env.MONGODB_URL;
Mongoose.connect(MONGODB_URL, {

    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true

})
    .then(() => App.listen(process.env.PORT || 5000))
    .catch(error => console.log(error.reason));

const App = Express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

App.use(cors());
App.use(bodyParser.json({ limit: "50mb" }));

App.post("/API/Users/SignUp", async (req, res) => {
    try {
        const duplicateUser = await Users.findOne({ email: req.body.email });
        if (duplicateUser) {
            res.send("Email already registered");
        }
        else {
            await (new Users({
                name: req.body.name,
                email: req.body.email,
                password: bcrypt.hashSync(req.body.password, 10),
                isSeller: req.body.isSeller
            })).save();
            res.send({
                "message": "Account created successfully",
            });
        }
    } catch (error) {
        res.send(error);
    }
});

App.post("/API/Users/SignIn", async (req, res) => {
    try {
        const user = await Users.findOne({
            email: req.body.email,
        });
        if (user && bcrypt.compareSync(req.body.password, user.password)) {
            res.send(
                {
                    message: "Sign in successfully",
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        address: user.address,
                        city: user.city,
                        postalCode: user.postalCode,
                        country: user.country,
                        isSeller: user.isSeller,
                        token: getToken(user)
                    }
                }
            )
        }
        else {
            res.send('Invalid Email Or Password')
        }
    } catch (error) {
        res.send(error);
    }
});

App.post("/API/Users/UpdateProfile", isAuth, async (req, res) => {
    try {
        await Users.findByIdAndUpdate(req.user._id, {
            $set: {
                name: req.body.name,
                address: req.body.address,
                city: req.body.city,
                postalCode: req.body.postalCode,
                country: req.body.country
            }
        });
        const user = await Users.findOne({ _id: req.user._id });
        res.send(
            {
                message: "Profile updated successfully",
                user: {
                    name: user.name,
                    email: user.email,
                    address: user.address,
                    city: user.city,
                    postalCode: user.postalCode,
                    country: user.country,
                    isSeller: user.isSeller,
                    token: getToken(user)
                }
            }
        );
    }
    catch (error) {
        res.send(error)
    }
});

App.post("/API/Users/UpdatePassword", isAuth, async (req, res) => {
    try {
        const user = await Users.findOne({ _id: req.user._id })
        if (bcrypt.compareSync(req.body.currentPassword, user.password)) {
            await Users.findByIdAndUpdate(req.user._id, {
                $set: {
                    password: bcrypt.hashSync(req.body.newPassword, 10)
                }
            });
            res.send(
                {
                    message: "Password updated successfully",
                }
            );
        }
        else {
            res.send({
                message: "Old password is incorrect"
            })
        }
    }
    catch (error) {
        res.send(error)
    }
});

App.post("/API/Products/Create", isAuth, isSeller, async (req, res) => {
    try {
        await new Product({
            sellerId: req.user._id,
            sellerName: req.user.name,
            category: req.body.category,
            image: req.body.image,
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
        }).save();
        res.send({
            message: "Product Created"
        });
    } catch (error) {
        return res.send(error);
    }
});

App.get("/API/sellerProducts", isAuth, isSeller, async (req, res) => {
    try {
        const products = await Product.find({ sellerId: req.user._id });
        res.send(products);
    } catch (error) {
        res.send(error)
    }
});

App.get("/API/Products", async (req, res) => {
    try {
        const products = await Product.find({});
        res.send(products);
    } catch (error) {
        res.send(error)
    }
});

App.get("/API/Products/:_id", async (req, res) => {
    try {
        const product = await Product.findOne({ _id: req.params._id });
        res.send(product);
    } catch (error) {
        res.send(error)
    }
});

App.post("/API/Products/Update/:_id", isAuth, isSeller, async (req, res) => {
    try {
        const _id = req.params._id;
        await Product.findByIdAndUpdate(_id, {
            $set: {
                category: String(req.body.category),
                image: String(req.body.image),
                name: String(req.body.name),
                price: req.body.price,
                description: req.body.description
            }
        });
        res.send({
            message: "Product Updated"
        })
    } catch (error) {
        res.send(error)
    }
});

App.post("/API/Products/Delete", isAuth, isSeller, async (req, res) => {
    try {
        for (let productId of req.body.deleteProducts) {
            const product = await Product.findOne({ _id: productId });
            await product.remove()
        }
        res.send({ message: "Product Deleted" });
    } catch (error) {
        res.send(error)
    }
});

App.get("/API/Orders", isAuth, async (req, res) => {
    try {
        let orders = await Order.find({ buyerId: req.user._id });
        res.send(orders.map(order => {
            return {
                ...order._doc,
                paid: order.dispatchedDate ?
                    new Date(order.dispatchedDate).getTime() + 1000 * 60 * 60 * 24 * 1 > new Date().getTime() ?
                        "Paid" :
                        order.paid ? "Paid" : "Not Paid"
                    : order.paid ? "Paid" : "Not Paid",
                deliveryStatus: order.dispatchedDate ?
                    new Date(order.dispatchedDate).getTime() + 1000 * 60 * 60 * 24 * 1 > new Date().getTime() ?
                        "Dispatched" : "Delivered"
                    : "Not Delivered"
            }
        }));
    } catch (error) {
        res.send(error)
    }
});

App.post("/API/Orders/Create", isAuth, async (req, res) => {
    try {
        const orders = new Order({
            buyerId: req.user._id,
            buyerName: req.body.name,
            buyerEmail: req.body.email,
            buyerAddress: req.body.address,
            buyerPostalCode: req.body.postalCode,
            deliveryMethod: req.body.deliveryMethod,
            paid: req.body.paid,
            deliveryStatus: req.body.sellerIds.map((sellerId) => {
                return {
                    sellerId: sellerId,
                    status: "Not Delivered"
                }
            }),
            orderItems: req.body.orderItems,
        })
        await orders.save();
        res.send({
            message: "Order Created"
        });
    } catch (error) {
        return res.send(error);
    }
});

App.get("/config", (req, res) => {
    res.send({
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
});

App.post("/create-payment-intent", async (req, res) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            currency: "INR",
            amount: req.body.amount * 80 * 100,
            automatic_payment_methods: { enabled: true },
        });

        // Send publishable key and PaymentIntent details to client
        res.send({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (e) {
        return res.status(400).send({
            error: {
                message: e.message,
            },
        });
    }
});

App.get("/API/Orders/:_id", isAuth, async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params._id,
            buyerId: req.user._id
        });
        res.send(order);
    } catch (error) {
        console.log(error)
        res.send({ message: "Order Not Found" })
    }
});

App.get("/API/Sales", isAuth, isSeller, async (req, res) => {
    try {
        const sales = await Order.find({
            deliveryStatus: {
                $elemMatch: {
                    sellerId: req.user._id,
                },
            },
        });
        res.send(sales.map((sale) => ({
            _id: sale._id,
            date: sale.date,
            buyerName: sale.buyerName,
            buyerEmail: sale.buyerEmail,
            buyerAddress: sale.buyerAddress,
            buyerPostalCode: sale.buyerPostalCode,
            orderItems: sale.orderItems.filter((item) => item.sellerId === req.user._id),
            deliveryStatus: sale.deliveryStatus.filter((item) => item.sellerId === req.user._id)[0].status,
        })));
    } catch (error) {
        res.send(error)
    }
});

App.post("/API/Orders/Dispatch", isAuth, isSeller, async (req, res) => {
    try {
        await Order.updateOne(
            {
                _id: req.body.id,
                "deliveryStatus.sellerId": req.user._id,
            },
            {
                $set: {
                    "deliveryStatus.$.status": "Dispatched",
                },
            }
        );
        const order = await Order.findById(req.body.id);
        const deliveryStatus = order.deliveryStatus.filter(status => status.status === "Not Delivered")
        if (deliveryStatus.length === 0) {
            await Order.updateOne(
                {
                    _id: req.body.id,
                },
                {
                    $set: {
                        dispatchedDate: new Date(),
                    },
                }
            );
        }
        res.send({
            message: "Order Dispatched"
        });
    }
    catch (error) {
        return res.send(error);
    }
});