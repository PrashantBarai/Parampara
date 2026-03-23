/**
 * gateway.js — Core Fabric Gateway Connector
 * 
 * Uses the EXISTING folders from deploy_chaincode.sh:
 *   ../_wallets/{OrgName}/{identity}.id   – X.509 certs (filesystem wallet)
 *   ../_gateways/{orgname}gateway.json    – per-org CCP (Connection Profile)
 * 
 * No connection-org.json or separate wallet folder needed.
 */

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const CHANNEL  = process.env.CHANNEL_NAME  || 'supplychain-channel';
const CC_NAME  = process.env.CHAINCODE_NAME || 'supplychain';

// Paths relative to fabric_api → parent (blockchain_backend)
const WALLETS_DIR  = path.resolve(__dirname, '..', '_wallets');
const GATEWAYS_DIR = path.resolve(__dirname, '..', '_gateways');

class FabricGateway {
  constructor() {
    this._walletCache   = {};   // orgName → Wallet instance
    this._ccpCache      = {};   // orgName → CCP json
  }

  // ── Load per-org wallet from _wallets/{OrgName}/ ────────────────────
  async _getWallet(orgName) {
    if (this._walletCache[orgName]) return this._walletCache[orgName];

    const walletPath = path.join(WALLETS_DIR, orgName);
    if (!fs.existsSync(walletPath)) {
      throw new Error(`Wallet directory not found: ${walletPath}`);
    }

    const wallet = await Wallets.newFileSystemWallet(walletPath);
    this._walletCache[orgName] = wallet;
    return wallet;
  }

  // ── Load per-org CCP from _gateways/{orgname}gateway.json ──────────
  _getCCP(orgName) {
    if (this._ccpCache[orgName]) return this._ccpCache[orgName];

    const gwFile = path.join(GATEWAYS_DIR, `${orgName.toLowerCase()}gateway.json`);
    if (!fs.existsSync(gwFile)) {
      throw new Error(`Gateway file not found: ${gwFile}`);
    }

    const ccp = JSON.parse(fs.readFileSync(gwFile, 'utf8'));

    // Microfab uses nip.io hostnames — rewrite URLs to localhost for local dev
    for (const peerKey of Object.keys(ccp.peers || {})) {
      ccp.peers[peerKey].url = 'grpc://localhost:9090';
    }
    for (const caKey of Object.keys(ccp.certificateAuthorities || {})) {
      ccp.certificateAuthorities[caKey].url = 'http://localhost:9090';
    }

    this._ccpCache[orgName] = ccp;
    return ccp;
  }

  // ── Get Contract handle ─────────────────────────────────────────────
  async getContract(identityLabel, orgName) {
    const wallet = await this._getWallet(orgName);

    const identity = await wallet.get(identityLabel);
    if (!identity) {
      throw new Error(
        `Identity "${identityLabel}" not found in _wallets/${orgName}/. ` +
        `Available: ${(await wallet.list()).join(', ')}`
      );
    }

    const ccp = this._getCCP(orgName);

    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: identityLabel,
      discovery: { enabled: true, asLocalhost: true },
    });

    const network = await gateway.getNetwork(CHANNEL);
    const contract = network.getContract(CC_NAME);

    return { gateway, contract };
  }

  // ── INVOKE (write to ledger) ────────────────────────────────────────
  async invoke(identityLabel, orgName, fnName, ...args) {
    try {
      const result = await this._withContract(
        identityLabel, orgName,
        async (contract) => contract.submitTransaction(fnName, ...args)
      );
      logger.info({
        action: 'INVOKE', fn: fnName,
        identity: identityLabel, org: orgName,
        args: args.map(a => String(a).substring(0, 80)),
      });
      return result;
    } catch (err) {
      logger.error({
        action: 'INVOKE_ERROR', fn: fnName,
        identity: identityLabel, org: orgName,
        error: err.message,
      });
      throw err;
    }
  }

  // ── QUERY (read from ledger) ────────────────────────────────────────
  async query(identityLabel, orgName, fnName, ...args) {
    try {
      const result = await this._withContract(
        identityLabel, orgName,
        async (contract) => contract.evaluateTransaction(fnName, ...args)
      );
      logger.info({
        action: 'QUERY', fn: fnName,
        identity: identityLabel, org: orgName,
      });
      return result;
    } catch (err) {
      logger.error({
        action: 'QUERY_ERROR', fn: fnName,
        identity: identityLabel, org: orgName,
        error: err.message,
      });
      throw err;
    }
  }

  // ── Helper: connect → run → disconnect ──────────────────────────────
  async _withContract(identityLabel, orgName, fn) {
    const { gateway, contract } = await this.getContract(identityLabel, orgName);
    try {
      const raw = await fn(contract);
      const str = raw.toString();
      return str ? JSON.parse(str) : { success: true };
    } finally {
      gateway.disconnect();
    }
  }
}

module.exports = new FabricGateway();
