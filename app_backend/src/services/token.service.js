const Token = require('../models/Token.model');
const blockchainService = require('./blockchain.service');
const { VALIDATION_REWARD_PT, WRONG_VALIDATION_PENALTY_PT, PT_VALUE_INR } = require('../utils/constants');

class TokenService {
  /**
   * Mint tokens for a validator (reward for correct validation)
   */
  async mint(validatorUserId, amount = VALIDATION_REWARD_PT, reason, referenceId) {
    // Ledger first
    const txId = await blockchainService.submitTransaction(
      'ValidatorOrg', 'MintTokens', validatorUserId.toString(), amount.toString(), reason
    );

    // Sync to MongoDB
    let tokenWallet = await Token.findOne({ userId: validatorUserId });
    if (!tokenWallet) {
      tokenWallet = new Token({ userId: validatorUserId, org: 'ValidatorOrg' });
    }

    tokenWallet.balance += amount;
    tokenWallet.totalEarned += amount;
    tokenWallet.transactions.push({
      type: 'EARNED', amount, reason, referenceId, blockchainTxId: txId,
    });
    tokenWallet.updatedAt = new Date();
    await tokenWallet.save();

    console.log(`🪙 Minted ${amount} PT for validator ${validatorUserId} (${reason})`);
    return { balance: tokenWallet.balance, txId, valueInINR: tokenWallet.balance * PT_VALUE_INR };
  }

  /**
   * Penalise a validator (wrong validation detected)
   */
  async penalise(validatorUserId, amount = WRONG_VALIDATION_PENALTY_PT, reason, referenceId) {
    const txId = await blockchainService.submitTransaction(
      'ValidatorOrg', 'PenaliseValidator', validatorUserId.toString(), amount.toString(), reason
    );

    let tokenWallet = await Token.findOne({ userId: validatorUserId });
    if (!tokenWallet) {
      tokenWallet = new Token({ userId: validatorUserId, org: 'ValidatorOrg' });
    }

    tokenWallet.balance = Math.max(0, tokenWallet.balance - amount);
    tokenWallet.totalPenalised += amount;
    tokenWallet.transactions.push({
      type: 'PENALTY', amount, reason, referenceId, blockchainTxId: txId,
    });
    tokenWallet.updatedAt = new Date();
    await tokenWallet.save();

    console.log(`⚠️ Penalised validator ${validatorUserId}: -${amount} PT (${reason})`);
    return { balance: tokenWallet.balance, txId };
  }

  /**
   * Get token balance
   */
  async getBalance(validatorUserId) {
    const wallet = await Token.findOne({ userId: validatorUserId });
    if (!wallet) return { balance: 0, valueInINR: 0, transactions: [] };
    return {
      balance: wallet.balance,
      valueInINR: wallet.balance * PT_VALUE_INR,
      totalEarned: wallet.totalEarned,
      totalPenalised: wallet.totalPenalised,
      totalRedeemed: wallet.totalRedeemed,
    };
  }

  /**
   * Redeem tokens (convert PT to INR)
   */
  async redeem(validatorUserId, amount) {
    const wallet = await Token.findOne({ userId: validatorUserId });
    if (!wallet || wallet.balance < amount) {
      throw { error: 'TKN_001', message: 'Insufficient PT balance' };
    }

    const txId = await blockchainService.submitTransaction(
      'ValidatorOrg', 'RedeemTokens', validatorUserId.toString(), amount.toString()
    );

    wallet.balance -= amount;
    wallet.totalRedeemed += amount;
    wallet.transactions.push({
      type: 'REDEEMED', amount, reason: `Redeemed ${amount} PT for ₹${amount * PT_VALUE_INR}`, blockchainTxId: txId,
    });
    wallet.updatedAt = new Date();
    await wallet.save();

    return { balance: wallet.balance, redeemed: amount, valueINR: amount * PT_VALUE_INR, txId };
  }

  /**
   * Get transaction history
   */
  async getTransactions(validatorUserId) {
    const wallet = await Token.findOne({ userId: validatorUserId });
    if (!wallet) return [];
    return wallet.transactions.sort((a, b) => b.timestamp - a.timestamp);
  }
}

module.exports = new TokenService();
