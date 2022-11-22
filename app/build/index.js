"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const validation_1 = __importDefault(require("./validation"));
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const prisma = new client_1.PrismaClient();
const app = express_1.default();
const port = 3001;
app.use(express_1.default.urlencoded({ extended: false }));
const obj = {
    name: "product",
    price: 100,
};
app.get('/data', (req, res) => {
    console.log("hi");
    res.status(200).send("Hello world!");
});
app.post('/object', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const response = req.body;
    console.log("response = ", response);
    const result = validation_1.default(response.name, response.price);
    // if (isValidData(response.name, response.price)) {
    //   const product: Object = await prisma.product.create({
    //     data: {
    //       name: response.name,
    //       price: response.price
    //     }
    //   })
    // } else {
    //   console.log("----------------error---------------");
    // }
    res.status(200).send(result);
    res.end("ok");
}));
app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map