const { Gateway, Wallets, X509Identity } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { fabricConfig, getOrgConfig, hasAccessToFunction } = require('../config/fabric');

class FabricService {
  constructor() {
    this.gateway = null;
    this.contract = null;
    this.wallets = {};
  }

  /**
   * Initialize Fabric Gateway connection
   * @param {string} orgName - Organization name
   * @param {string} userId - User identity
   */
  async initializeGateway(orgName, userId) {
    try {
      console.log(`[Fabric] Initializing gateway for ${orgName}...`);

      // Get organization config
      const orgConfig = getOrgConfig(orgName);
      if (!orgConfig) {
        throw new Error(`Organization ${orgName} not found`);
      }

      // Create new gateway
      const gateway = new Gateway();

      // Load connection profile
      let connectionProfile;
      if (fs.existsSync(fabricConfig.connectionProfile)) {
        const connectionData = fs.readFileSync(fabricConfig.connectionProfile, 'utf8');
        connectionProfile = JSON.parse(connectionData);
      } else {
        // Use default connection profile for development
        connectionProfile = this.getDefaultConnectionProfile();
      }

      // Get wallet
      const wallet = await this.getWallet(orgName);

      // Connect to gateway
      await gateway.connect(connectionProfile, {
        wallet,
        identity: userId,
        discovery: { enabled: true, asLocalhost: true }
      });

      this.gateway = gateway;

      // Get network and contract
      const network = await gateway.getNetwork(fabricConfig.network.channel);
      this.contract = network.getContract(
        fabricConfig.network.chaincode,
        '',
        fabricConfig.network.chaincodeVersion
      );

      console.log(`[Fabric] Gateway connected for ${orgName}`);
      return true;
    } catch (error) {
      console.error(`[Fabric] Failed to initialize gateway: ${error.message}`);
      throw error;
    }
  }

  /**
   * Disconnect from Fabric gateway
   */
  async disconnect() {
    if (this.gateway) {
      await this.gateway.disconnect();
      this.gateway = null;
      this.contract = null;
    }
  }

  /**
   * Evaluate a chaincode function (read-only)
   */
  async evaluateTransaction(functionName, ...args) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      console.log(`[Fabric] Evaluating ${functionName} with args:`, args);
      const result = await this.contract.evaluateTransaction(functionName, ...args);
      return JSON.parse(result.toString());
    } catch (error) {
      console.error(`[Fabric] Evaluation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Submit a chaincode transaction (write)
   */
  async submitTransaction(functionName, ...args) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }
      console.log(`[Fabric] Submitting ${functionName} with args:`, args);
      const result = await this.contract.submitTransaction(functionName, ...args);
      return JSON.parse(result.toString());
    } catch (error) {
      console.error(`[Fabric] Transaction failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get or create wallet
   */
  async getWallet(orgName) {
    try {
      const walletPath = fabricConfig.walletPath;

      // Create wallet directory if not exists
      if (!fs.existsSync(walletPath)) {
        fs.mkdirSync(walletPath, { recursive: true });
      }

      const wallet = await Wallets.newFileSystemWallet(walletPath);

      // Check if identity exists, if not, enroll user
      const identity = await wallet.get(fabricConfig.userContext.adminUser);
      if (!identity) {
        await this.enrollUser(wallet, orgName);
      }

      return wallet;
    } catch (error) {
      console.error(`[Fabric] Wallet error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Enroll user with CA
   */
  async enrollUser(wallet, orgName) {
    try {
      const { FabricCAServices } = require('fabric-ca-client');
      const orgConfig = getOrgConfig(orgName);

      // Construct CA URL
      const caUrl = `http://${orgConfig.ca}:7054`;
      const ca = new FabricCAServices(caUrl);

      // Enroll admin
      const enrollment = await ca.enroll({
        enrollmentID: fabricConfig.userContext.adminUser,
        enrollmentSecret: fabricConfig.userContext.enrollmentSecret
      });

      // Create identity
      const x509Identity = {
        credentials: {
          certificate: enrollment.certificate,
          privateKey: enrollment.key.toBytes()
        },
        mspId: orgConfig.mspId,
        type: 'X.509'
      };

      // Store in wallet
      await wallet.put(fabricConfig.userContext.adminUser, x509Identity);
      console.log(`[Fabric] User ${fabricConfig.userContext.adminUser} enrolled`);
    } catch (error) {
      console.error(`[Fabric] Enrollment error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if organization has access to function
   */
  checkAccess(orgName, functionName) {
    return hasAccessToFunction(orgName, functionName);
  }

  /**
   * Get default connection profile for development
   */
  getDefaultConnectionProfile() {
    return {
      name: 'supplychain-network',
      version: '1.0.0',
      client: {
        organization: 'NGOOrg',
        connection: {
          timeout: {
            peer: {
              endorser: '300'
            }
          }
        }
      },
      organizations: {
        NGOOrg: {
          mspid: 'NGOOrgMSP',
          peers: ['peer0.ngo.example.com'],
          certificateAuthorities: ['ca.ngo.example.com']
        }
      },
      peers: {
        'peer0.ngo.example.com': {
          url: 'grpc://localhost:7051',
          tlsCACerts: {
            pem: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----'
          }
        }
      },
      certificateAuthorities: {
        'ca.ngo.example.com': {
          url: 'http://localhost:7054',
          caName: 'ca-ngo',
          tlsCACerts: {
            pem: 'pem_content'
          },
          httpOptions: {
            verify: false
          }
        }
      },
      channels: {
        'supplychain-channel': {
          orderers: ['orderer.example.com'],
          peers: {
            'peer0.ngo.example.com': {
              endorsingPeer: true,
              chaincodeQuery: true,
              ledgerQuery: true,
              eventSource: true
            }
          }
        }
      }
    };
  }
}

module.exports = new FabricService();
