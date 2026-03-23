const Artisan = require('../models/Artisan.model');
const GICertificate = require('../models/GICertificate.model');
const blockchainService = require('./blockchain.service');
const imageService = require('./image.service');
const tokenService = require('./token.service');
const { v4: uuidv4 } = require('uuid');

class ValidatorService {
  /**
   * Register artisan with GI certificate (by NGO)
   */
  async registerArtisan(ngoUser, artisanData, giCertFile) {
    const artisanId = `ART-${uuidv4().slice(0, 8).toUpperCase()}`;
    let certCID = '', certHash = '';

    if (giCertFile) {
      certCID = await imageService.uploadToIPFS(giCertFile.buffer, giCertFile.originalname);
      certHash = imageService.getImageHash(giCertFile.buffer);
    }

    // LEDGER FIRST
    const txId = await blockchainService.submitTransaction(
      ngoUser.org, 'RegisterArtisan', artisanId, artisanData.name,
      artisanData.craft, artisanData.location, certCID, certHash
    );

    // Sync MongoDB
    const artisan = await Artisan.create({
      artisanId, name: artisanData.name, craft: artisanData.craft,
      location: artisanData.location, registeredBy: ngoUser.id,
      giCertificateCID: certCID, giCertificateHash: certHash,
      verificationStatus: 'PENDING_VERIFICATION', blockchainTxId: txId,
    });

    const certId = `CERT-${uuidv4().slice(0, 8).toUpperCase()}`;
    await GICertificate.create({
      certificateId: certId, artisanId, certificateCID: certCID,
      certificateHash: certHash, issuedBy: artisanData.issuedBy,
      issuedDate: artisanData.issuedDate, expiryDate: artisanData.expiryDate,
      craftType: artisanData.craftType, region: artisanData.region,
      blockchainTxId: txId,
    });

    return { artisan, certificateId: certId, txId };
  }

  /**
   * Verify artisan GI certificate (by ValidatorOrg)
   */
  async verifyArtisan(validatorUser, artisanId, isValid, reason) {
    const artisan = await Artisan.findOne({ artisanId });
    if (!artisan) throw { status: 404, error: 'VAL_002', message: 'Artisan not found' };
    if (artisan.verificationStatus !== 'PENDING_VERIFICATION') {
      throw { status: 400, error: 'VAL_001', message: `Artisan already ${artisan.verificationStatus}` };
    }

    // LEDGER FIRST
    const txId = await blockchainService.submitTransaction(
      'ValidatorOrg', 'ValidateArtisan', artisanId, validatorUser.id.toString(),
      isValid.toString(), reason || ''
    );

    // Update artisan
    artisan.verificationStatus = isValid ? 'VERIFIED' : 'REJECTED';
    artisan.verifiedBy = validatorUser.id;
    artisan.verifiedAt = new Date();
    if (!isValid) artisan.rejectionReason = reason;
    await artisan.save();

    // Update GI certificate
    await GICertificate.findOneAndUpdate(
      { artisanId },
      { validationStatus: isValid ? 'VALID' : 'INVALID', validatedBy: validatorUser.id, validatedAt: new Date() }
    );

    // Reward validator with PT if approved
    if (isValid) {
      await tokenService.mint(validatorUser.id, 1, `Verified artisan ${artisanId}`, artisanId);
    }

    return { artisan, txId };
  }

  /**
   * Flag artisan as fraudulent (penalise the validator who approved)
   */
  async flagArtisan(user, artisanId, flagReason) {
    const artisan = await Artisan.findOne({ artisanId });
    if (!artisan) throw { status: 404, error: 'VAL_002', message: 'Artisan not found' };

    // LEDGER FIRST
    const txId = await blockchainService.submitTransaction(
      user.org, 'FlagArtisan', artisanId, flagReason
    );

    artisan.verificationStatus = 'FLAGGED_FRAUDULENT';
    artisan.flaggedAt = new Date();
    artisan.flagReason = flagReason;
    await artisan.save();

    // Penalise the validator who approved this artisan
    if (artisan.verifiedBy) {
      await tokenService.penalise(
        artisan.verifiedBy, 2,
        `Wrong validation for artisan ${artisanId}: ${flagReason}`, artisanId
      );
    }

    return { artisan, txId };
  }

  async getPendingVerifications() {
    return Artisan.getPendingVerifications();
  }

  async getArtisan(artisanId) {
    const artisan = await Artisan.findOne({ artisanId }).populate('registeredBy', 'name org').populate('verifiedBy', 'name org');
    if (!artisan) throw { status: 404, error: 'VAL_002', message: 'Artisan not found' };
    const cert = await GICertificate.findOne({ artisanId });
    return { artisan, certificate: cert };
  }
}

module.exports = new ValidatorService();
