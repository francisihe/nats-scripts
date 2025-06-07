
import { StringCodec, connect } from "nats";

async function main() {
  
  const natsUrl = process.env.NATS_URL || "nats://localhost:4222";
  const subject = process.argv[2] || "identities.*.*.verified"; 

  const nc = await connect({ servers: natsUrl });
  const sc = StringCodec();

  console.log(`Subscribed to "${subject}" on ${natsUrl}`);
  const sub = nc.subscribe(subject);

  for await (const m of sub) {
    console.log(`[${m.subject}]`, sc.decode(m.data));
  }
}

main().catch(console.error);
