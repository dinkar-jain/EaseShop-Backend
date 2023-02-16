import Mongoose from "mongoose";

const UserSchema = new Mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, default: "" },
    postalCode: { type: String },
    country: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isSeller: { type: Boolean, required: true, default: false }
});

const UsersModel = Mongoose.model("Users", UserSchema);
const Users = UsersModel

const ProductSchema = new Mongoose.Schema({
    sellerId: { type: String, required: true },
    sellerName: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, default: 0, required: true },
    description: { type: String, required: true },
});

const ProductsModel = Mongoose.model("Product", ProductSchema);
const Product = ProductsModel

const OrderSchema = new Mongoose.Schema({
    date: { type: Date, default: Date.now },
    buyerId: { type: String, required: true },
    buyerName: { type: String, required: true },
    buyerEmail: { type: String, required: true },
    buyerAddress: { type: String, required: true },
    buyerPostalCode: { type: String, required: true },
    deliveryMethod: { type: String, required: true },
    paid: { type: Boolean, required: true, default: false },
    deliveryStatus: [
        {
            sellerId: { type: String, required: true },
            status: { type: String, required: true, default: "Not Delivered" }
        }
    ],
    orderItems: [],
    dispatchedDate: { type: Date },
});

const OrdersModel = Mongoose.model("Order", OrderSchema);
const Order = OrdersModel

export { Users, Product, Order }