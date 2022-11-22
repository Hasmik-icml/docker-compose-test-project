import express, { Request, Response } from "express";
import axios from "axios";

const app = express();

const PORT = 3002;

app.get("/a", async (req: Request, res: Response) => {
  try {
    let response = await axios.get("http://app1:3000/data");
    res.status(response.status).send(response.data);
  } catch (error) {
    console.log(error);
  }
});

app.get("/b/:name", async (req: Request, res: Response) => {
  try {
    const name = req.params.name;
    // const { limit } = req.query;
    // console.log("params= ", name, limit);

    let response = await axios.post(`http://app1:3000/find/${name}`); 

    res.status(response.status).send(response.data);
  } catch (error) {
    console.log(error);
    res.status(404).send("exit");
  }
});

app.get("/a/test", (req: Request, res: Response) => {
  res.status(200).send({ ok: 1 });
});

app.listen(PORT, () => {
  console.log(`Proxy server is runing on ${PORT} port...`);
});
