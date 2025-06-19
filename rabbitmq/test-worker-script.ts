import * as amqp from "amqplib";
import { v4 as uuidv4 } from "uuid";

async function sendTestMessage() {
  try {
    const connection = await amqp.connect("amqp://guest:guest@localhost:5673");
    const channel = await connection.createChannel();

    // Use default exchange and routing key that matches the working queue
    const exchangeName = ""; // Default exchange
    const queueName = "CREATE_TRANSACTION"; // Bound queue
    const routingKey = queueName; // For default exchange, routingKey == queue name

    const testTransaction = {
      owner_id: uuidv4(),
      reference_id: uuidv4(),
      created_at: new Date().toISOString(),
      transaction_type: "credit",
      transaction_sub_type: "deposit",
      amount: 150.75,
      currency: "USD",
      source_system: "hisa-wallet",
      status: "pending",
      transaction_metadata: {
        status: "pending",
        external_reference: "payment-" + Math.floor(Math.random() * 1000000),
        description: "Deposit to trading account",
        balance_before: 250,
        balance_after: 400.75,
        asset_type: "fiat"
      }
    };

    console.log("Sending test transaction:", testTransaction);

    // Send the message to the correct queue via default exchange
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(testTransaction)), {
      contentType: "application/json",
      persistent: true,
      headers: {
        command: "create.transaction"
      }
    });

    console.log(`Message published to queue '${queueName}' via default exchange`);

    setTimeout(() => {
      connection.close();
      console.log("Connection closed");
    }, 1000);
  } catch (error) {
    console.error("Error sending test message:", error);
  }
}

sendTestMessage();
