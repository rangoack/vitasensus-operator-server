import * as vitejs from "@vite/vitejs";

const TEXT_SIGN_PREFIX = "Vite Signed Message:\n";

export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
) {
  return vitejs.utils.ed25519.verify(
    vitejs.utils.blake2bHex(TEXT_SIGN_PREFIX + message, null, 32),
    vitejs.utils._Buffer.from(signature, "base64").toString("hex"),
    vitejs.utils._Buffer.from(publicKey, "base64").toString("hex")
  );
}
