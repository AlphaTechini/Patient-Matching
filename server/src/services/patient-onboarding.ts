import { Wallet } from "ethers";
import crypto from "crypto";
import {
  T3nClient,
  setEnvironment,
  loadWasmComponent,
  createEthAuthInput,
  metamask_sign,
  getScriptVersion,
  getNodeUrl,
} from "@terminal3/t3n-sdk";

// Encryption for storing private keys
const ENCRYPTION_ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.WALLET_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("WALLET_ENCRYPTION_KEY not set in environment");
  }
  // Ensure key is 32 bytes for AES-256
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptPrivateKey(privateKey: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);

  let encrypted = cipher.update(privateKey, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted (all base64)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptPrivateKey(encryptedData: string): string {
  const key = getEncryptionKey();
  const [ivB64, authTagB64, encryptedB64] = encryptedData.split(":");

  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

export interface PatientAccount {
  patientDid: string;
  ethAddress: string;
  encryptedPrivateKey: string;
  createdAt: Date;
}

export async function createPatientAccount(): Promise<PatientAccount> {
  setEnvironment("testnet");

  // Generate new Ethereum wallet
  const wallet = Wallet.createRandom();
  const privateKey = wallet.privateKey;
  const ethAddress = wallet.address;

  // Connect to T3N and create DID
  const wasmComponent = await loadWasmComponent();
  const t3nClient = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(ethAddress, undefined, privateKey),
    },
  });

  await t3nClient.handshake();
  const authResult = await t3nClient.authenticate(createEthAuthInput(ethAddress));
  const patientDid = authResult.value; // did:t3n:xxx

  // Encrypt private key for storage
  const encryptedPrivateKey = encryptPrivateKey(privateKey);

  return {
    patientDid,
    ethAddress,
    encryptedPrivateKey,
    createdAt: new Date(),
  };
}

export async function getPatientClient(encryptedPrivateKey: string, ethAddress: string): Promise<T3nClient> {
  setEnvironment("testnet");

  const privateKey = decryptPrivateKey(encryptedPrivateKey);

  const wasmComponent = await loadWasmComponent();
  const client = new T3nClient({
    wasmComponent,
    handlers: {
      EthSign: metamask_sign(ethAddress, undefined, privateKey),
    },
  });

  await client.handshake();
  await client.authenticate(createEthAuthInput(ethAddress));

  return client;
}

export async function storePatientHealthData(
  client: T3nClient,
  pdfText: string,
  fileName: string,
): Promise<void> {
  // Note: For MVP, we're storing health records in MongoDB temporarily
  // In production, this should use T3N's user profile storage when available
  // The TEE contract will fetch this data via our API endpoint
  console.log(`Health data ready to store (${pdfText.length} chars). Storage method: via MongoDB for MVP.`);
  
  // For now, we'll just validate the client is authenticated
  // The actual storage happens in the route handler which stores in MongoDB
}
