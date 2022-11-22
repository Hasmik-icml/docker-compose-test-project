import { body, check, validationResult } from "express-validator";
import jwt from "jsonwebtoken";

const bodyparser = require("body-parser");
// const jwt = require("jsonwebtoken");

//import { PrismaClient } from "@prisma/client";

import Prisma, { User } from "@prisma/client";

import express, { Express, Request, Response } from "express";
import bodyParser from "body-parser";

import { Kafka } from "kafkajs";

const { PrismaClient } = Prisma;

const jwtSecretKey = "gfg_jwt_secret_key";

const kafka = new Kafka({
  clientId: "app",
  brokers: ["kafka1:9092"],
});

const app: Express = express();
const port = 3000;

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "test-group2" });
consumer.subscribe({ topic: "topic-test2", fromBeginning: true });

let getData: String;

consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log({
      value: message.value,
    });

    getData = JSON.parse(message.value?.toString() || "");

    console.log("getData=", getData);
  },
});

const prisma = new PrismaClient();

interface UserPayload {
  permissions: {
    Filtered: string[];
    Product: string[];
  };
  user: {
    id: number;
    username: string;
    role: string;
  };
  exp: number;
  iat: number;
}

declare global {
  namespace Express {
    interface Request {
      currentUser?: UserPayload;
    }
  }
}

app.use((req: Request, res: Response, next) => {
  const token: any = req.headers.authorization?.slice(7); // type error String
  const payload = jwt.verify(token, jwtSecretKey) as UserPayload;
  console.log("payload ====", payload);

  console.log("aaaaaaaaaaaaaaaa ==", payload);

  if (!payload) {
    return res.status(401).send("Invalid token.");
  } else {
    req.currentUser = payload;
    next();
  }
});

app.get("/data", async (req: Request, res: Response) => {
  console.log(33333333333, req.currentUser); // to check permissions

  if (req.currentUser?.permissions["Product"].includes("read")) {
    const products: any = await prisma.product.findMany({
      // where: {
      //   id:1
      // },
      orderBy: {
        id: "asc",
      },
    });

    await producer.connect();
    await producer.send({
      topic: "topic-test",
      messages: [{ value: JSON.stringify(products) }],
    });

    res.status(200).send(products);
    return;
  } else {
    return res.status(401).send("User have not permission.");
  }
});

app.post(
  "/post",
  check("name").isString(),
  check("price").isNumeric(),
  async (req: Request, res: Response) => {
    console.log("this is post request....");

    const { name, price } = req.body;
    console.log("response = ", req.body);

    const errors = validationResult(req);
    console.log("errors-----------------", errors.isEmpty());

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors,
        msg: "Check your data type",
      });
    }

    if (req.currentUser?.permissions["Product"].includes("create")) {
      const products = await prisma.product.create({
        data: {
          name,
          price,
        },
      });
      res.status(200).send(products);
      return;
    } else {
      res.status(401).send("User have not permission.");
    }
  }
);

app.put(
  "/post/:id",
  body("name").isString(),
  body("price").isNumeric(),

  async (req: Request, res: Response) => {
    console.log("this is update request....");

    const { name, price } = req.body;
    const { id } = req.params;
    console.log("params =", req.params);

    console.log("response = ", req.body);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors,
        msg: "Check your data type",
      });
    }

    if (req.currentUser?.permissions["Product"].includes("update")) {
      const products = await prisma.product.update({
        where: {
          id: Number(id),
        },
        data: {
          name,
          price,
        },
      });
      res.status(200).send(products);
      return;
    } else {
      res.status(401).send("User have not permission.");
    }
  }
);

app.delete("/post/:id", async (req: Request, res: Response) => {
  console.log("This is delete request...");

  const { id } = req.params;
  console.log("params=", req.params);

  console.log("response = ", req.body);

  if (req.currentUser?.permissions["Product"].includes("delete")) {
    const products = await prisma.product.delete({
      where: {
        id: Number(id),
      },
    });

    res.status(200).send(products);
    return;
  } else {
    res.status(401).send("User have not permission.");
  }
});

app.post("/find/:name", async (req: Request, res: Response) => {
  console.log("finde...");

  try {
    const { name } = req.params;
    // console.log("params=", prName);
    console.log("params namecin index.js=", name);
    // console.log("response = ", req.body);

    //find products by name
    const products = await prisma.product.findMany({
      where: {
        name,
      },
    });

    console.log("poducts=", products);

    //sending message to consumer /write in topic <topic-test>/
    await producer.connect();
    await producer.send({
      topic: "topic-test",
      messages: [{ value: JSON.stringify(products) }],
    });
    console.log("mi ban");

    await producer.disconnect();

    //isExist data in filtered tabel
    const exist = await prisma.filtered.findMany({
      where: {
        name: req.params.name,
      },
    });

    console.log("exist in filtered table=", exist);

    //write <getData> in tabel by name filtered data
    for (let key in getData) {
      console.log("key=", key);
      console.log("value=", getData[key]);

      // const json = getData[key]

      // console.log( "json=", typeof json);

      const json = JSON.stringify(getData[key]);

      if (exist.length === 0) {
        console.log("done");
        await prisma.filtered.create({
          data: {
            name: key,
            price: json,
          },
        });
      }
    }

    res.status(200).send(products).end();
  } catch (error: any) {
    console.log(error.message);

    res.status(400).json({
      message: "check your data type.",
    });
  }
});

app.get("/isExist/:price", async (req: Request, res: Response) => {
  try {
    const findingPrice = req.params;
    const result: String[] = [];

    const products = await prisma.filtered.findMany({
      select: {
        price: true,
      },
    });

    console.log("data from filtered table=", products);

    for (let i = 0; i < products.length; i++) {
      const prices = products[i].price as string;
      console.log("prices=", prices);
      let temp: any = JSON.parse(prices);

      if (temp.every((p: any): Boolean => p < Number(findingPrice.price))) {
        result.push(temp);
      }
    }

    res.status(200).send(result);
  } catch (error) {
    console.log("err=", error);
  }

  res.end();
});

app.listen(port, () => {
  console.log(`server is running on port ${port}`);
});
