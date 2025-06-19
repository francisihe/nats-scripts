import * as amqp from "amqplib";

async function sendTestStatementMessage() {
  try {
    const connection = await amqp.connect("amqp://guest:guest@localhost:5673");
    const channel = await connection.createChannel();

    // Use the queue name that matches your worker configuration
    const exchangeName = ""; // Default exchange
    const queueName = "PROCESS_STATEMENT"; // Queue that the worker listens to
    const routingKey = queueName; // For default exchange, routingKey == queue name

    // Test statement generation request
    const testStatement = {
      owner_id: "c93b7f94-701e-4b4b-9b79-56201fe736c2", // owner ID
      start_date: "2025-01-01", // Start of period
      end_date: "2025-06-20", // Current date or end of period
      email: "francisihejirikarise@gmail.com", // Where to send the statement
      format: "excel" // pdf or excel
    };

    console.log("Sending test statement generation request:", testStatement);

    // Send the message with the correct command header
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(testStatement)), {
      contentType: "application/json",
      persistent: true,
      headers: {
        command: "process.statement" // The command to process transactions
      }
    });

    console.log(`Message published to queue '${queueName}' via default exchange with command 'process.statement'`);

    setTimeout(() => {
      connection.close();
      console.log("Connection closed");
    }, 1000);
  } catch (error) {
    console.error("Error sending test message:", error);
  }
}

sendTestStatementMessage();
