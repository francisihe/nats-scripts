//filepath: scripts/nats-publish.ts
import { StringCodec, connect } from "nats";

async function main() {
  const nc = await connect({ servers: "localhost:4222" });
  const sc = StringCodec();

  const data = {
    id: "test-identity-id",
    identity_type: "bvn",
    identifier: "2348165148492",
    account_id: "9e2c4d20-2d4f-4b62-b690-6a7a276c2c9f",
    country: "gh",
    verification_status: "verified",
    verification_metadata: {
      reason: "",
      address: "",
      provider: "metamap",
      full_name: "Francis Ihejirika",
      last_name: "Ihejirika",
      first_name: "Francis",
      selfie_url: "",
      date_of_birth: null,
      government_photo: "",
      is_face_verified: false,
      is_valid_document: true,
      provider_reference: "test-provider-ref"
    },
    provider_metadata: {},
    created_at: "2025-06-06T19:59:18.998Z",
    updated_at: "2025-06-06T19:59:18.998Z"
  };

  nc.publish("identities.ng.bvn.verified", sc.encode(JSON.stringify(data)));
  await nc.drain();
  console.log("Published test identity event");
}

main();
