package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// ═══════════════════════════════════════════════════════════════════════════════
// DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

// Margin represents a price margin added by a supply chain org
type Margin struct {
	Org       string  `json:"org"`
	Value     float64 `json:"value"`
	Timestamp string  `json:"timestamp"`
}

// LifecycleEntry represents a checkpoint in the product journey
type LifecycleEntry struct {
	Stage     string `json:"stage"`
	Org       string `json:"org"`
	ImageCID  string `json:"imageCID"`
	ImageHash string `json:"imageHash"`
	Location  string `json:"location"`
	Timestamp string `json:"timestamp"`
}

// FeedbackEntry represents customer feedback
type FeedbackEntry struct {
	CustomerHash string `json:"customerHash"`
	Rating       int    `json:"rating"`
	Comment      string `json:"comment"`
	ImageCID     string `json:"imageCID"`
	Timestamp    string `json:"timestamp"`
}

// Product is the core ledger asset
type Product struct {
	DocType       string           `json:"docType"`
	ProductID     string           `json:"productId"`
	Name          string           `json:"name"`
	Ngo           string           `json:"ngo"`
	ArtisanID     string           `json:"artisanId"`
	BasePrice     float64          `json:"basePrice"`
	CurrentPrice  float64          `json:"currentPrice"`
	ImageCID      string           `json:"imageCID"`
	ImageHash     string           `json:"imageHash"`
	CurrentOwner  string           `json:"currentOwner"`
	Status        string           `json:"status"`
	ReturnCount   int              `json:"returnCount"`
	IsRetired     bool             `json:"isRetired"`
	Margins       []Margin         `json:"margins"`
	Lifecycle     []LifecycleEntry `json:"lifecycle"`
	Feedback      []FeedbackEntry  `json:"feedback"`
	CustomerHash  string           `json:"customerHash"`
}

// Artisan represents an artisan registered by NGO
type Artisan struct {
	DocType            string `json:"docType"`
	ArtisanID          string `json:"artisanId"`
	Name               string `json:"name"`
	Craft              string `json:"craft"`
	Location           string `json:"location"`
	GICertCID          string `json:"giCertCID"`
	GICertHash         string `json:"giCertHash"`
	RegisteredBy       string `json:"registeredBy"`
	VerificationStatus string `json:"verificationStatus"`
	VerifiedBy         string `json:"verifiedBy"`
	VerifiedAt         string `json:"verifiedAt"`
	RejectionReason    string `json:"rejectionReason"`
	FlaggedAt          string `json:"flaggedAt"`
	FlagReason         string `json:"flagReason"`
}

// TokenWallet represents a validator's PT token balance
type TokenWallet struct {
	DocType        string             `json:"docType"`
	ValidatorID    string             `json:"validatorId"`
	Balance        float64            `json:"balance"`
	TotalEarned    float64            `json:"totalEarned"`
	TotalPenalised float64            `json:"totalPenalised"`
	TotalRedeemed  float64            `json:"totalRedeemed"`
	Transactions   []TokenTransaction `json:"transactions"`
}

// TokenTransaction represents a single token event
type TokenTransaction struct {
	Type        string  `json:"type"`
	Amount      float64 `json:"amount"`
	Reason      string  `json:"reason"`
	ReferenceID string  `json:"referenceId"`
	Timestamp   string  `json:"timestamp"`
}

// HistoryEntry for GetHistory results
type HistoryEntry struct {
	TxID      string   `json:"txId"`
	Timestamp string   `json:"timestamp"`
	Value     *Product `json:"value"`
	IsDelete  bool     `json:"isDelete"`
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const (
	PriceCapMultiplier = 2.0
	MaxReturns         = 3
	PTValueINR         = 10.0
	ValidationReward   = 1.0
	WrongPenalty       = 2.0
)

// Valid supply chain transfer sequence
var validTransfers = map[string]string{
	"NGOOrg":          "ManufacturerOrg",
	"ManufacturerOrg": "WarehouseOrg",
	"WarehouseOrg":    "DistributorOrg",
	"DistributorOrg":  "RetailerOrg",
	"RetailerOrg":     "CustomerOrg",
}

// Orgs allowed to add margins / lifecycle / transfer
var supplyChainOrgs = map[string]bool{
	"WarehouseOrg":   true,
	"DistributorOrg": true,
	"RetailerOrg":    true,
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTRACT
// ═══════════════════════════════════════════════════════════════════════════════

// SupplyChainContract is the smart contract for ParamparaChain
type SupplyChainContract struct {
	contractapi.Contract
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

func now() string {
	return time.Now().UTC().Format(time.RFC3339)
}

func getCallerMSP(ctx contractapi.TransactionContextInterface) (string, error) {
	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return "", fmt.Errorf("failed to get caller MSP: %v", err)
	}
	return mspID, nil
}

func mspToOrg(mspID string) string {
	// e.g., "NGOOrgMSP" → "NGOOrg"
	if len(mspID) > 3 && mspID[len(mspID)-3:] == "MSP" {
		return mspID[:len(mspID)-3]
	}
	return mspID
}

func requireOrg(ctx contractapi.TransactionContextInterface, allowedOrgs ...string) (string, error) {
	mspID, err := getCallerMSP(ctx)
	if err != nil {
		return "", err
	}
	org := mspToOrg(mspID)
	for _, allowed := range allowedOrgs {
		if org == allowed {
			return org, nil
		}
	}
	return "", fmt.Errorf("access denied: org '%s' not in allowed list %v", org, allowedOrgs)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCT FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// RegisterProduct creates a new product on the ledger (NGOOrg only)
func (s *SupplyChainContract) RegisterProduct(
	ctx contractapi.TransactionContextInterface,
	productID string, name string, ngo string,
	basePriceStr string, imageCID string, imageHash string,
	artisanID string,
) error {
	// Access control: NGOOrg only
	callerOrg, err := requireOrg(ctx, "NGOOrg")
	if err != nil {
		return err
	}

	// Check product doesn't already exist
	existing, err := ctx.GetStub().GetState("PRODUCT_" + productID)
	if err != nil {
		return fmt.Errorf("failed to check product existence: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("product %s already exists", productID)
	}

	// Check artisan is VERIFIED
	artisanBytes, err := ctx.GetStub().GetState("ARTISAN_" + artisanID)
	if err != nil {
		return fmt.Errorf("failed to read artisan: %v", err)
	}
	if artisanBytes != nil {
		var artisan Artisan
		if err := json.Unmarshal(artisanBytes, &artisan); err == nil {
			if artisan.VerificationStatus != "VERIFIED" {
				return fmt.Errorf("artisan %s is not VERIFIED (status: %s)", artisanID, artisan.VerificationStatus)
			}
		}
	}

	basePrice, err := strconv.ParseFloat(basePriceStr, 64)
	if err != nil {
		return fmt.Errorf("invalid base price: %v", err)
	}
	if basePrice <= 0 {
		return fmt.Errorf("base price must be positive")
	}

	product := Product{
		DocType:      "product",
		ProductID:    productID,
		Name:         name,
		Ngo:          callerOrg,
		ArtisanID:    artisanID,
		BasePrice:    basePrice,
		CurrentPrice: basePrice,
		ImageCID:     imageCID,
		ImageHash:    imageHash,
		CurrentOwner: callerOrg,
		Status:       "REGISTERED",
		ReturnCount:  0,
		IsRetired:    false,
		Margins:      []Margin{},
		Lifecycle: []LifecycleEntry{
			{Stage: "CREATED", Org: callerOrg, Timestamp: now()},
		},
		Feedback: []FeedbackEntry{},
	}

	productBytes, err := json.Marshal(product)
	if err != nil {
		return fmt.Errorf("failed to marshal product: %v", err)
	}

	return ctx.GetStub().PutState("PRODUCT_"+productID, productBytes)
}

// AddLifecycle adds a lifecycle checkpoint (WarehouseOrg, DistributorOrg, RetailerOrg)
func (s *SupplyChainContract) AddLifecycle(
	ctx contractapi.TransactionContextInterface,
	productID string, stage string, org string,
	imageCID string, imageHash string, location string,
) error {
	callerOrg, err := requireOrg(ctx, "WarehouseOrg", "DistributorOrg", "RetailerOrg")
	if err != nil {
		return err
	}

	product, err := s.getProductInternal(ctx, productID)
	if err != nil {
		return err
	}
	if product.IsRetired {
		return fmt.Errorf("product %s is RETIRED", productID)
	}
	if product.CurrentOwner != callerOrg {
		return fmt.Errorf("caller %s is not the current owner %s", callerOrg, product.CurrentOwner)
	}

	entry := LifecycleEntry{
		Stage:     stage,
		Org:       callerOrg,
		ImageCID:  imageCID,
		ImageHash: imageHash,
		Location:  location,
		Timestamp: now(),
	}
	product.Lifecycle = append(product.Lifecycle, entry)

	return s.putProduct(ctx, product)
}

// AddMargin adds a price margin at the current stage
func (s *SupplyChainContract) AddMargin(
	ctx contractapi.TransactionContextInterface,
	productID string, org string, marginValueStr string,
) error {
	callerOrg, err := requireOrg(ctx, "WarehouseOrg", "DistributorOrg", "RetailerOrg")
	if err != nil {
		return err
	}

	product, err := s.getProductInternal(ctx, productID)
	if err != nil {
		return err
	}
	if product.IsRetired {
		return fmt.Errorf("product %s is RETIRED", productID)
	}
	if product.CurrentOwner != callerOrg {
		return fmt.Errorf("caller %s is not the current owner %s", callerOrg, product.CurrentOwner)
	}

	marginValue, err := strconv.ParseFloat(marginValueStr, 64)
	if err != nil {
		return fmt.Errorf("invalid margin value: %v", err)
	}
	if marginValue < 0 {
		return fmt.Errorf("margin value cannot be negative")
	}

	newPrice := product.CurrentPrice + marginValue
	maxPrice := product.BasePrice * PriceCapMultiplier
	if newPrice > maxPrice {
		return fmt.Errorf("price %.2f exceeds cap %.2f (%dx base)", newPrice, maxPrice, int(PriceCapMultiplier))
	}

	margin := Margin{
		Org:       callerOrg,
		Value:     marginValue,
		Timestamp: now(),
	}
	product.Margins = append(product.Margins, margin)
	product.CurrentPrice = newPrice

	return s.putProduct(ctx, product)
}

// TransferOwnership transfers product to the next org in the supply chain
func (s *SupplyChainContract) TransferOwnership(
	ctx contractapi.TransactionContextInterface,
	productID string, fromOrg string, toOrg string,
) error {
	// Allow supply chain orgs + CustomerOrg (for returns)
	callerOrg, err := requireOrg(ctx, "NGOOrg", "WarehouseOrg", "DistributorOrg", "RetailerOrg", "CustomerOrg")
	if err != nil {
		return err
	}

	product, err := s.getProductInternal(ctx, productID)
	if err != nil {
		return err
	}
	if product.IsRetired {
		return fmt.Errorf("product %s is RETIRED", productID)
	}
	if product.CurrentOwner != callerOrg {
		return fmt.Errorf("caller %s is not the current owner %s", callerOrg, product.CurrentOwner)
	}

	// Validate transfer sequence (forward or return)
	if toOrg == "WarehouseOrg" && callerOrg == "CustomerOrg" {
		// Return flow: Customer → Warehouse (valid)
	} else {
		expectedNext, ok := validTransfers[callerOrg]
		if !ok || expectedNext != toOrg {
			return fmt.Errorf("invalid transfer: %s → %s (expected %s → %s)", callerOrg, toOrg, callerOrg, expectedNext)
		}
	}

	product.CurrentOwner = toOrg

	// Update status based on destination
	switch toOrg {
	case "ManufacturerOrg":
		product.Status = "REGISTERED"
	case "WarehouseOrg":
		if callerOrg == "CustomerOrg" {
			product.Status = "RETURNED"
		} else {
			product.Status = "IN_WAREHOUSE"
		}
	case "DistributorOrg":
		product.Status = "IN_DISTRIBUTION"
	case "RetailerOrg":
		product.Status = "IN_RETAIL"
	case "CustomerOrg":
		product.Status = "SOLD"
	}

	return s.putProduct(ctx, product)
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// GetProduct reads a product from the ledger
func (s *SupplyChainContract) GetProduct(
	ctx contractapi.TransactionContextInterface,
	productID string,
) (*Product, error) {
	return s.getProductInternal(ctx, productID)
}

// GetAllProducts returns all products from the ledger
func (s *SupplyChainContract) GetAllProducts(
	ctx contractapi.TransactionContextInterface,
) ([]*Product, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("PRODUCT_", "PRODUCT_~")
	if err != nil {
		return nil, fmt.Errorf("failed to get products: %v", err)
	}
	defer resultsIterator.Close()

	var products []*Product
	for resultsIterator.HasNext() {
		result, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var product Product
		if err := json.Unmarshal(result.Value, &product); err != nil {
			return nil, err
		}
		products = append(products, &product)
	}
	return products, nil
}

// GetHistory returns the full transaction history for a product
func (s *SupplyChainContract) GetHistory(
	ctx contractapi.TransactionContextInterface,
	productID string,
) ([]HistoryEntry, error) {
	historyIterator, err := ctx.GetStub().GetHistoryForKey("PRODUCT_" + productID)
	if err != nil {
		return nil, fmt.Errorf("failed to get history: %v", err)
	}
	defer historyIterator.Close()

	var history []HistoryEntry
	for historyIterator.HasNext() {
		modification, err := historyIterator.Next()
		if err != nil {
			return nil, err
		}

		entry := HistoryEntry{
			TxID:      modification.TxId,
			Timestamp: time.Unix(modification.Timestamp.Seconds, int64(modification.Timestamp.Nanos)).UTC().Format(time.RFC3339),
			IsDelete:  modification.IsDelete,
		}

		if !modification.IsDelete {
			var product Product
			if err := json.Unmarshal(modification.Value, &product); err == nil {
				entry.Value = &product
			}
		}
		history = append(history, entry)
	}
	return history, nil
}

// VerifyProduct verifies product authenticity by image hash
func (s *SupplyChainContract) VerifyProduct(
	ctx contractapi.TransactionContextInterface,
	productID string, imageHash string,
) (string, error) {
	product, err := s.getProductInternal(ctx, productID)
	if err != nil {
		return "", err
	}

	result := map[string]interface{}{
		"productId":    productID,
		"valid":        product.ImageHash == imageHash,
		"originalHash": product.ImageHash,
		"providedHash": imageHash,
	}
	resultBytes, _ := json.Marshal(result)
	return string(resultBytes), nil
}

// ═══════════════════════════════════════════════════════════════════════════════
// CUSTOMER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// AddFeedback submits customer feedback (CustomerOrg only)
func (s *SupplyChainContract) AddFeedback(
	ctx contractapi.TransactionContextInterface,
	productID string, customerHash string,
	ratingStr string, comment string, imageCID string,
) error {
	_, err := requireOrg(ctx, "CustomerOrg")
	if err != nil {
		return err
	}

	product, err := s.getProductInternal(ctx, productID)
	if err != nil {
		return err
	}

	rating, err := strconv.Atoi(ratingStr)
	if err != nil || rating < 1 || rating > 5 {
		return fmt.Errorf("rating must be between 1 and 5")
	}

	feedback := FeedbackEntry{
		CustomerHash: customerHash,
		Rating:       rating,
		Comment:      comment,
		ImageCID:     imageCID,
		Timestamp:    now(),
	}
	product.Feedback = append(product.Feedback, feedback)

	return s.putProduct(ctx, product)
}

// InitiateReturn starts a return process (CustomerOrg only)
func (s *SupplyChainContract) InitiateReturn(
	ctx contractapi.TransactionContextInterface,
	productID string, customerHash string, reason string,
) error {
	_, err := requireOrg(ctx, "CustomerOrg")
	if err != nil {
		return err
	}

	product, err := s.getProductInternal(ctx, productID)
	if err != nil {
		return err
	}

	if product.Status != "SOLD" && product.Status != "DELIVERED" {
		return fmt.Errorf("product must be SOLD or DELIVERED to return (current: %s)", product.Status)
	}
	if product.ReturnCount >= MaxReturns {
		return fmt.Errorf("max returns (%d) reached, product is RETIRED", MaxReturns)
	}

	product.ReturnCount++
	product.Status = "RETURNED"

	// Add return lifecycle entry
	product.Lifecycle = append(product.Lifecycle, LifecycleEntry{
		Stage:     "RETURNED",
		Org:       "CustomerOrg",
		Location:  reason,
		Timestamp: now(),
	})

	// Auto-retire after max returns
	if product.ReturnCount >= MaxReturns {
		product.IsRetired = true
		product.Status = "RETIRED"
	}

	// Clear customer hash since product is being returned
	product.CustomerHash = ""

	return s.putProduct(ctx, product)
}

// ═══════════════════════════════════════════════════════════════════════════════
// ARTISAN FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// RegisterArtisan registers a new artisan (NGOOrg only)
func (s *SupplyChainContract) RegisterArtisan(
	ctx contractapi.TransactionContextInterface,
	artisanID string, name string, craft string,
	location string, giCertCID string, giCertHash string,
) error {
	callerOrg, err := requireOrg(ctx, "NGOOrg")
	if err != nil {
		return err
	}

	// Check artisan doesn't already exist
	existing, err := ctx.GetStub().GetState("ARTISAN_" + artisanID)
	if err != nil {
		return fmt.Errorf("failed to check artisan: %v", err)
	}
	if existing != nil {
		return fmt.Errorf("artisan %s already exists", artisanID)
	}

	artisan := Artisan{
		DocType:            "artisan",
		ArtisanID:          artisanID,
		Name:               name,
		Craft:              craft,
		Location:           location,
		GICertCID:          giCertCID,
		GICertHash:         giCertHash,
		RegisteredBy:       callerOrg,
		VerificationStatus: "PENDING_VERIFICATION",
	}

	artisanBytes, err := json.Marshal(artisan)
	if err != nil {
		return fmt.Errorf("failed to marshal artisan: %v", err)
	}

	return ctx.GetStub().PutState("ARTISAN_"+artisanID, artisanBytes)
}

// ValidateArtisan approves or rejects an artisan (ValidatorOrg only)
func (s *SupplyChainContract) ValidateArtisan(
	ctx contractapi.TransactionContextInterface,
	artisanID string, validatorID string,
	isValidStr string, reason string,
) error {
	_, err := requireOrg(ctx, "ValidatorOrg")
	if err != nil {
		return err
	}

	artisanBytes, err := ctx.GetStub().GetState("ARTISAN_" + artisanID)
	if err != nil {
		return fmt.Errorf("failed to read artisan: %v", err)
	}
	if artisanBytes == nil {
		return fmt.Errorf("artisan %s not found", artisanID)
	}

	var artisan Artisan
	if err := json.Unmarshal(artisanBytes, &artisan); err != nil {
		return fmt.Errorf("failed to unmarshal artisan: %v", err)
	}

	if artisan.VerificationStatus != "PENDING_VERIFICATION" {
		return fmt.Errorf("artisan %s already %s", artisanID, artisan.VerificationStatus)
	}

	isValid := isValidStr == "true"
	if isValid {
		artisan.VerificationStatus = "VERIFIED"
	} else {
		artisan.VerificationStatus = "REJECTED"
		artisan.RejectionReason = reason
	}
	artisan.VerifiedBy = validatorID
	artisan.VerifiedAt = now()

	artisanBytes, _ = json.Marshal(artisan)
	return ctx.GetStub().PutState("ARTISAN_"+artisanID, artisanBytes)
}

// FlagArtisan flags an artisan as fraudulent (NGOOrg or ValidatorOrg)
func (s *SupplyChainContract) FlagArtisan(
	ctx contractapi.TransactionContextInterface,
	artisanID string, flagReason string,
) error {
	_, err := requireOrg(ctx, "NGOOrg", "ValidatorOrg")
	if err != nil {
		return err
	}

	artisanBytes, err := ctx.GetStub().GetState("ARTISAN_" + artisanID)
	if err != nil {
		return fmt.Errorf("failed to read artisan: %v", err)
	}
	if artisanBytes == nil {
		return fmt.Errorf("artisan %s not found", artisanID)
	}

	var artisan Artisan
	if err := json.Unmarshal(artisanBytes, &artisan); err != nil {
		return fmt.Errorf("failed to unmarshal artisan: %v", err)
	}

	artisan.VerificationStatus = "FLAGGED_FRAUDULENT"
	artisan.FlaggedAt = now()
	artisan.FlagReason = flagReason

	artisanBytes, _ = json.Marshal(artisan)
	return ctx.GetStub().PutState("ARTISAN_"+artisanID, artisanBytes)
}

// GetArtisan reads an artisan from the ledger
func (s *SupplyChainContract) GetArtisan(
	ctx contractapi.TransactionContextInterface,
	artisanID string,
) (*Artisan, error) {
	artisanBytes, err := ctx.GetStub().GetState("ARTISAN_" + artisanID)
	if err != nil {
		return nil, fmt.Errorf("failed to read artisan: %v", err)
	}
	if artisanBytes == nil {
		return nil, fmt.Errorf("artisan %s not found", artisanID)
	}

	var artisan Artisan
	if err := json.Unmarshal(artisanBytes, &artisan); err != nil {
		return nil, fmt.Errorf("failed to unmarshal artisan: %v", err)
	}
	return &artisan, nil
}

// GetAllArtisans returns all artisans
func (s *SupplyChainContract) GetAllArtisans(
	ctx contractapi.TransactionContextInterface,
) ([]*Artisan, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("ARTISAN_", "ARTISAN_~")
	if err != nil {
		return nil, fmt.Errorf("failed to get artisans: %v", err)
	}
	defer resultsIterator.Close()

	var artisans []*Artisan
	for resultsIterator.HasNext() {
		result, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		var artisan Artisan
		if err := json.Unmarshal(result.Value, &artisan); err != nil {
			return nil, err
		}
		artisans = append(artisans, &artisan)
	}
	return artisans, nil
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN FUNCTIONS (Parampara Token - PT)
// ═══════════════════════════════════════════════════════════════════════════════

// MintTokens awards PT to a validator
func (s *SupplyChainContract) MintTokens(
	ctx contractapi.TransactionContextInterface,
	validatorID string, amountStr string, reason string,
) error {
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return fmt.Errorf("invalid amount: %v", err)
	}

	wallet, err := s.getOrCreateWallet(ctx, validatorID)
	if err != nil {
		return err
	}

	wallet.Balance += amount
	wallet.TotalEarned += amount
	wallet.Transactions = append(wallet.Transactions, TokenTransaction{
		Type:      "EARNED",
		Amount:    amount,
		Reason:    reason,
		Timestamp: now(),
	})

	return s.putWallet(ctx, wallet)
}

// PenaliseValidator deducts PT from a validator
func (s *SupplyChainContract) PenaliseValidator(
	ctx contractapi.TransactionContextInterface,
	validatorID string, amountStr string, reason string,
) error {
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return fmt.Errorf("invalid amount: %v", err)
	}

	wallet, err := s.getOrCreateWallet(ctx, validatorID)
	if err != nil {
		return err
	}

	wallet.Balance -= amount
	if wallet.Balance < 0 {
		wallet.Balance = 0
	}
	wallet.TotalPenalised += amount
	wallet.Transactions = append(wallet.Transactions, TokenTransaction{
		Type:      "PENALTY",
		Amount:    amount,
		Reason:    reason,
		Timestamp: now(),
	})

	return s.putWallet(ctx, wallet)
}

// GetTokenBalance returns a validator's PT balance
func (s *SupplyChainContract) GetTokenBalance(
	ctx contractapi.TransactionContextInterface,
	validatorID string,
) (*TokenWallet, error) {
	return s.getOrCreateWallet(ctx, validatorID)
}

// RedeemTokens converts PT to INR
func (s *SupplyChainContract) RedeemTokens(
	ctx contractapi.TransactionContextInterface,
	validatorID string, amountStr string,
) error {
	_, err := requireOrg(ctx, "ValidatorOrg")
	if err != nil {
		return err
	}

	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		return fmt.Errorf("invalid amount: %v", err)
	}

	wallet, err := s.getOrCreateWallet(ctx, validatorID)
	if err != nil {
		return err
	}

	if wallet.Balance < amount {
		return fmt.Errorf("insufficient balance: %.2f PT (requested: %.2f)", wallet.Balance, amount)
	}

	wallet.Balance -= amount
	wallet.TotalRedeemed += amount
	wallet.Transactions = append(wallet.Transactions, TokenTransaction{
		Type:      "REDEEMED",
		Amount:    amount,
		Reason:    fmt.Sprintf("Redeemed %.0f PT for ₹%.0f", amount, amount*PTValueINR),
		Timestamp: now(),
	})

	return s.putWallet(ctx, wallet)
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTERNAL HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

func (s *SupplyChainContract) getProductInternal(ctx contractapi.TransactionContextInterface, productID string) (*Product, error) {
	productBytes, err := ctx.GetStub().GetState("PRODUCT_" + productID)
	if err != nil {
		return nil, fmt.Errorf("failed to read product: %v", err)
	}
	if productBytes == nil {
		return nil, fmt.Errorf("product %s not found", productID)
	}

	var product Product
	if err := json.Unmarshal(productBytes, &product); err != nil {
		return nil, fmt.Errorf("failed to unmarshal product: %v", err)
	}
	return &product, nil
}

func (s *SupplyChainContract) putProduct(ctx contractapi.TransactionContextInterface, product *Product) error {
	productBytes, err := json.Marshal(product)
	if err != nil {
		return fmt.Errorf("failed to marshal product: %v", err)
	}
	return ctx.GetStub().PutState("PRODUCT_"+product.ProductID, productBytes)
}

func (s *SupplyChainContract) getOrCreateWallet(ctx contractapi.TransactionContextInterface, validatorID string) (*TokenWallet, error) {
	walletBytes, err := ctx.GetStub().GetState("TOKEN_" + validatorID)
	if err != nil {
		return nil, fmt.Errorf("failed to read wallet: %v", err)
	}

	if walletBytes == nil {
		return &TokenWallet{
			DocType:      "tokenWallet",
			ValidatorID:  validatorID,
			Balance:      0,
			Transactions: []TokenTransaction{},
		}, nil
	}

	var wallet TokenWallet
	if err := json.Unmarshal(walletBytes, &wallet); err != nil {
		return nil, fmt.Errorf("failed to unmarshal wallet: %v", err)
	}
	return &wallet, nil
}

func (s *SupplyChainContract) putWallet(ctx contractapi.TransactionContextInterface, wallet *TokenWallet) error {
	walletBytes, err := json.Marshal(wallet)
	if err != nil {
		return fmt.Errorf("failed to marshal wallet: %v", err)
	}
	return ctx.GetStub().PutState("TOKEN_"+wallet.ValidatorID, walletBytes)
}
