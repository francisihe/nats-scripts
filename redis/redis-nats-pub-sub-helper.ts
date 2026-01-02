// filepath: scripts/hybrid-broadcast.ts
import { JSONCodec, connect } from "nats";
import Redis, { RedisOptions } from "ioredis";

// CONFIGURATION: Replace with your actual Upstash URL
const REDIS_URL="rediss://default:xxxOTc@promoted-eel-35197.upstash.io:6379"
const NATS_URL = "nats://localhost:4222";

async function runTest() {
  const transport = process.argv[2]; 
  const mode = process.argv[3];      
  const subject = process.argv[4] || "broadcasts.ui";
  const jc = JSONCodec();

  if (transport === "redis") {
    const isCloudRedis = REDIS_URL.includes('upstash.io') || 
                         REDIS_URL.includes('redis.cloud');

    const config: RedisOptions = {
      ...(REDIS_URL.startsWith('rediss://') && { tls: {} }),
      enableReadyCheck: !isCloudRedis,
      connectTimeout: isCloudRedis ? 15000 : 10000,
      enableOfflineQueue: false,
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => {
        if (times > 10) return null;
        return Math.min(1000 * Math.pow(2, times - 1), 30000);
      },
    };

    const redis = new Redis(REDIS_URL, config);

    // FIX: Wait for the connection to be "ready" before sending commands
    // This prevents the "Stream isn't writeable" error when offline queue is disabled
    await new Promise((resolve, reject) => {
      redis.once("ready", () => {
        console.log(`📡 [Redis] Connected and Ready: ${REDIS_URL.split('@')[1]}`);
        resolve(true);
      });
      redis.once("error", (err) => {
        console.error(`❌ [Redis] Connection Error: ${err.message}`);
        reject(err);
      });
    });

    if (mode === "sub") {
      console.log(`[Redis] 👂 Listening on channel: ${subject}`);
      await redis.subscribe(subject);
      redis.on("message", (channel, message) => {
        try {
          console.log(`[Redis Received] channel: ${channel}, data:`, JSON.parse(message));
        } catch (e) {
          console.log(`[Redis Received] channel: ${channel}, raw: ${message}`);
        }
      });
    } else {
      const data = { message: "Standalone test to Upstash", time: Date.now() };
      const payload = JSON.stringify({ channel: subject, data, timestamp: new Date().toISOString() });

      await redis.publish(subject, payload);
      console.log(`✅ [Redis] Broadcast sent to ${subject}`);
      
      // Allow time for the network packet to reach the cloud before exiting
      setTimeout(() => process.exit(0), 1000);
    }
  } 
  
  else if (transport === "nats") {
    // ... (Your NATS logic remains the same)
    const nc = await connect({ servers: NATS_URL });
    if (mode === "sub") {
      console.log(`[NATS] 👂 Listening on subject: ${subject}`);
      const sub = nc.subscribe(subject);
      for await (const m of sub) {
        console.log(`[NATS Received] subject: ${m.subject}, data:`, jc.decode(m.data));
      }
    } else {
      nc.publish(subject, jc.encode({ message: "NATS test", time: Date.now() }));
      console.log(`✅ [NATS] Broadcast sent to ${subject}`);
      await nc.drain();
      process.exit(0);
    }
  }
}

runTest().catch((err) => {
  console.error("Fatal Error:", err.message);
  process.exit(1);
});


// SAMPLE USAGE

// Sub
// francisiherise@Franciss-MacBook-Pro enterprise-core % npx ts-node hybrid-broadcast.ts redis sub broadcasts.ui

// Pub
// francisiherise@Franciss-MacBook-Pro enterprise-core % npx ts-node hybrid-broadcast.ts redis pub broadcasts.ui
// 📡 [Redis] Connected and Ready: promoted-eel-35197.upstash.io:6379
// ✅ [Redis] Broadcast sent to broadcasts.ui
