import { createPublicKey, verify } from "crypto";

export function verifyDiscordEd25519(
  publicKeyHex: string,
  signatureHex: string,
  timestamp: string,
  body: Buffer,
): boolean {
  try {
    // Convert raw 32-byte public key to an SPKI DER wrapper so Node can verify.
    const publicKeyDer = Buffer.concat([
      Buffer.from("302a300506032b6570032100", "hex"),
      Buffer.from(publicKeyHex, "hex"),
    ]);

    const keyObj = createPublicKey({
      key: publicKeyDer,
      format: "der",
      type: "spki",
    });

    const message = Buffer.concat([Buffer.from(timestamp), body]);

    return verify(null, message, keyObj, Buffer.from(signatureHex, "hex"));
  } catch {
    return false;
  }
}
