const express = require("express");
const passport = require("passport/lib");
const passportLocal = require("passport-local/lib");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");

const app = express();
const port = 3001;

const prisma = new PrismaClient();

const jwtSecretKey = "gfg_jwt_secret_key";

app.use(passport.initialize());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

passport.use(
  new passportLocal.Strategy(
    {
      usernameField: "username",
    },
    async (username, password, done) => {
      const user = await prisma.user.findUnique({
        where: {
          username: username, // or userName
        },
      });
      console.log("user from db=", user);

      if (!user) {
        return done(null, false, { message: "Incorrect username" });
      }

      if (await bcrypt.compare(password, user.password)) {
        return done(null, user);
      }

      return done(null, false, { message: "Incorrect password" });
    }
  )
);

//create user with username and password and save in db
app.post("/signup", async (req, res) => {
  const data = req.body;
  console.log(data);

  const { username, password, role } = req.body;
  console.log("pass=", password);

  const hashedPass = await bcrypt.hash(password, 10);
  console.log("hashedPass=", hashedPass);

  //write in db
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPass,
      role,
    },
  });

  const userId = await prisma.user.findUnique({
    where: {
      username,
    },
  });

  const permissions = await prisma.permissions.findMany({});

  for (let i = 0; i < permissions.length; i++) {
    const user = await prisma.userPermissions.create({
      data: {
        userId: userId.id,
        permission_id: permissions[i].id,
        create: false,
        read: true,
        update: false,
        delete: false,
      },
    });
  }

  console.log("userId=", userId);

  res.status(200).send(user);
});

//get valid token from db
app.get("/tokens/:token", async (req, res) => {
  const reqToken = req.params;
  console.log("params=", reqToken);

  const validToken = await prisma.token.findFirst({
    where: {
      access: reqToken.token,
      accessExp: { gte: new Date() },
      deleted: false,
    },
  });

  console.log("validToken=", validToken);

  if (!validToken) {
    res.status(404).send("invalid token");
  } else {
    res.status(200).send({ token: validToken.access });
  }
});

//refreshing the token that received by params
app.post("/refresh/:token", async (req, res) => {
  const reqToken = req.params;
  console.log("params=", reqToken);

  const validToken = await prisma.token.findFirst({
    where: {
      refresh: reqToken.token,
      refreshExp: { gte: new Date() },
      deleted: false,
    },
  });

  console.log("validToken=", validToken);

  if (!validToken) {
    res.status(401).send("Invalid token");
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      id: validToken.userId,
    },
  });

  console.log("user=", user);

  setDeletStatus(validToken.id, true);

  const tokens = await writeTokensInTable(user);

  return res.status(200).send({
    token_access: tokens.accessToken,
    token_refresh: tokens.refreshToken,
  });
});

//other test
app.get("/login", async (req, res) => {
  const token = await prisma.token.findMany({
    where: {
      userId: 1,
    },
  });

  const tokenDecod = token[0].access;
  const decodedValue = jwt.decode(tokenDecod, { complete: true });

  const exp = decodedValue.payload.exp;

  if (exp * 1000 <= Date.now()) {
    res.send("log out");
  } else {
    res.send({ token: token[0], decodedValue: decodedValue, exp });
  }
});

//
app.get("/", async (req, res) => {
  let token = req.rawHeaders[1];
  console.log(2222222222, token.slice(7));

  console.log(isValidToken(token).then((data) => {
    console.log(data);
  }));
  try {
    let response = await axios.get("http://app1:3000/data", {
      // headers: { Authorization: `Bearer ${token}` },
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    console.log(11111, error);
  }
});

app.post("/string", async (req, res) => {
  const string = req.body;

  const str = await prisma.tolowercase.create({
    data: {
      name: string.name,
    },
  });

  res.status(200).send(str);
});

//test request convert upercase to lowercase by $queryRow
app.put("/string/tolowercase", async (req, res) => {
  // const result = await prisma.$queryRaw`UPDATE "Tolowercase" SET name = lower(name)`

  const result = await prisma.tolowercase.updateMany({
    where: {
      name: "AAAAAAAAAAAAAA",
    },
    data: {
      name: "aaaaaaaaaaaaaa",
    },
  });

  res.status(200).send(result);
});

//login and generate tokens
app.post("/login", (req, res) => {
  passport.authenticate("local", async function (err, user, info) {
    if (err) {
      return res.status(401).json(err);
    }

    if (user) {
      const tokens = await writeTokensInTable(user);
      console.log("tokens=", tokens);

      return res.status(200).send({
        token_access: tokens.accessToken,
        token_refresh: tokens.refreshToken,
      });
    } else {
      res.status(401).json(info);
    }
  })(req, res);
});

//generate tokens with user permissions and write in db
async function writeTokensInTable(user) {
  // console.log("user=", user);
  const user_ = await prisma.user.findFirst({
    where: user,
    include: { user_permission: { include: { permission: true } } },
  });

  const accessTo = {};

  for (const u of user_.user_permission) {
    const accessValues = [];

    for (const [key] of Object.entries(u)) {
      if (u[key] === true) {
        accessValues.push(key);
      }

      accessTo[u.permission.per_name] = accessValues;
    }
  }

  console.log("accessTo =", accessTo);

  // const accessToken = jwt.sign({exp: Date.now() + (15 * 60 * 1000), permissions: accessTo, user },jwtSecretKey);
  // const refreshToken = jwt.sign({exp: Date.now() + (20 * 60 * 1000), user }, jwtSecretKey);

  const accessToken = jwt.sign({ permissions: accessTo, user }, jwtSecretKey, {
    expiresIn: "15m",
  });

  const refreshToken = jwt.sign({ user }, jwtSecretKey, {
    expiresIn: 15 * 60,
  });

  console.log("accessToken=", accessToken);

  const decodedAccess = jwt.decode(accessToken, { complete: true });
  const decodedRefresh = jwt.decode(refreshToken, { complete: true });

  // console.log("decoded=", new Date(decodedAccess.payload.exp));
  // console.log("decoded=", new Date(decodedRefresh.payload.exp));

  const tokens = await prisma.token.create({
    data: {
      access: accessToken,
      accessExp: new Date(decodedAccess.payload.exp * 1000),
      refresh: refreshToken,
      refreshExp: new Date(decodedRefresh.payload.exp * 1000),
      userId: user.id,
      deleted: false,
    },
  });

  return {
    accessToken,
    refreshToken,
  };
}

//set status
async function setDeletStatus(validTokenId, status) {
  const deleteStatus = await prisma.token.update({
    where: { id: validTokenId },
    data: { deleted: status },
  });
}

app.listen(port, () => {
  console.log(`Server is running on ${port}...`);
});

//check token
async function isValidToken(token) {

  const validToken = await prisma.token.findFirst({
    where: {
      access: token.token,
      accessExp: { gte: new Date() },
      deleted: false,
    },
  });

  console.log("validToken=", validToken);

  if (!validToken) {
    return false;
  } else {
    return true;
  }
}
