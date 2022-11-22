import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "consumer",
  brokers: ["kafka1:9092"],
});

// const admin = kafka.admin();
const producer = kafka.producer();

// admin.connect();

// const topicName: string[] = ['topic-test'];

// admin.createTopics({
//   topics:[{ topic: 'topic-test', replicationFactor: 1, numPartitions: 10 }]
// })

const consumer = kafka.consumer({ groupId: "test-group" });
let newDataForProduser: Object = {};

consumer.subscribe({ topic: "topic-test", fromBeginning: true });

consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    console.log({
      value: message.value?.toString(),
    });
    const newData = JSON.parse(message.value?.toString() || "");

    console.log("my data=", newData);
    const price: Number[] = [];

    for (let i = 0; i < newData.length; i++) {
      price.push(newData[i].price);
    }

    if (newData[0]?.name) {
      newDataForProduser = {
        [newData[0].name]: price,
      };
    }

    // console.log(newDataForProduser);

    await producer.connect();
    await producer.send({
      topic: "topic-test2",
      messages: [{ value: JSON.stringify(newDataForProduser) }],
    });

    console.log("sendData=", JSON.stringify(newDataForProduser));

    await producer.disconnect();
  },
});
