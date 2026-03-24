#!/bin/bash
#
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║          PARAMPARA - CHAINCODE DEPLOYMENT SCRIPT                         ║
# ╠═══════════════════════════════════════════════════════════════════════════╣
# ║  Project: ParamparaChain - GI Product Supply Chain                       ║
# ║  Purpose: Deploy chaincode to Microfab (7 orgs, single channel)          ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# PREREQUISITES:
# 1. Start Microfab:
#    export MICROFAB_CONFIG=$(cat MICROFAB.txt)
#    docker run --name microfab -e MICROFAB_CONFIG -p 9090:9090 ibmcom/ibp-microfab
#
# 2. Generate wallets/gateways/MSP:
#    curl -s http://console.127-0-0-1.nip.io:9090/ak/api/v1/components | weft microfab -w ./_wallets -p ./_gateways -m ./_msp -f
#
# 3. Install Fabric binaries (peer, configtxgen, etc.):
#    curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary
#
# QUICK START:
#   1. Package:   source ./deploy_chaincode.sh package
#   2. Install:   source ./deploy_chaincode.sh install
#   3. Deploy:    source ./deploy_chaincode.sh deploy
#   4. Test:      source ./deploy_chaincode.sh test
#
# =============================================================================

# =============================================================================
# Global Configuration Variables
# =============================================================================
PROJECT_ROOT="/home/luminalcore/Academics/Hackathon/RGIT_Recursion_7/Parampara/blockchain_backend"
ORDERER_URL="orderer-api.127-0-0-1.nip.io:9090"
MSP_BASE_PATH="${PROJECT_ROOT}/_msp"
CONTRACTS_PATH="./contracts/supplychain"
CHANNEL_NAME="supplychain-channel"
CHAINCODE_NAME="supplychain"

# All 7 organizations from MICROFAB.txt
ALL_ORGS=("NGOOrg" "ValidatorOrg" "ManufacturerOrg" "WarehouseOrg" "DistributorOrg" "RetailerOrg" "CustomerOrg")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo ""
    echo -e "${CYAN}============================================================================${NC}"
    echo -e "${CYAN} $1${NC}"
    echo -e "${CYAN}============================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

print_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[WARN] $1${NC}"
}

setup_fabric_env() {
    export PATH=$PATH:${PWD}/bin
    export FABRIC_CFG_PATH=${PWD}/config
    print_info "Fabric environment paths configured"
}

# =============================================================================
# Organization Context Switching
# =============================================================================

# Generic switch function for any org
# Microfab naming convention:
#   MSP ID:       NGOOrgMSP
#   Admin folder:  _msp/NGOOrg/ngoorgadmin/msp
#   Peer address:  ngoorgpeer-api.127-0-0-1.nip.io:9090
switch_to_org() {
    local ORG=$1

    # Convert org name to lowercase for folder/peer naming
    local ORG_LOWER=$(echo "${ORG}" | tr '[:upper:]' '[:lower:]')

    local MSP_ID="${ORG}MSP"
    local MSP_PATH="${MSP_BASE_PATH}/${ORG}/${ORG_LOWER}admin/msp"
    local PEER_ADDRESS="${ORG_LOWER}peer-api.127-0-0-1.nip.io:9090"

    # Verify MSP path exists
    if [ ! -d "${MSP_PATH}" ]; then
        print_error "MSP path not found: ${MSP_PATH}"
        print_info "Run weft to generate MSP: curl -s http://console.127-0-0-1.nip.io:9090/ak/api/v1/components | weft microfab -w ./_wallets -p ./_gateways -m ./_msp -f"
        return 1
    fi

    export CORE_PEER_LOCALMSPID="${MSP_ID}"
    export CORE_PEER_MSPCONFIGPATH="${MSP_PATH}"
    export CORE_PEER_ADDRESS="${PEER_ADDRESS}"

    setup_fabric_env
    print_success "Now using ${ORG} identity (${PEER_ADDRESS})"
}

# =============================================================================
# Chaincode Packaging
# =============================================================================

package_chaincode() {
    print_header "Packaging Supplychain Chaincode"

    cd "${PROJECT_ROOT}"
    setup_fabric_env

    # Check if contracts directory exists
    if [ ! -d "${CONTRACTS_PATH}" ]; then
        print_error "Contracts directory not found: ${CONTRACTS_PATH}"
        return 1
    fi

    # Run go mod tidy + vendor
    cd "${CONTRACTS_PATH}"
    print_info "Running go mod tidy..."
    go mod tidy
    print_info "Running go mod vendor..."
    go mod vendor
    cd "${PROJECT_ROOT}"

    # Auto-detect next version
    latest_version=0
    for file in ${CHAINCODE_NAME}_*.tar.gz; do
        if [ -f "$file" ]; then
            version=$(echo "$file" | sed -n "s/${CHAINCODE_NAME}_\([0-9]*\).tar.gz/\1/p")
            if [ "$version" -gt "$latest_version" ] 2>/dev/null; then
                latest_version=$version
            fi
        fi
    done

    new_version=$((latest_version + 1))
    package_label="${CHAINCODE_NAME}_${new_version}"
    package_file="${package_label}.tar.gz"

    print_info "Version: ${new_version}"
    print_info "Package: ${package_file}"
    print_info "Label: ${package_label}"
    print_info "Path: ${CONTRACTS_PATH}"

    # Package the chaincode
    peer lifecycle chaincode package "${package_file}" \
        --path "${CONTRACTS_PATH}" \
        --lang golang \
        --label "${package_label}"

    if [ $? -eq 0 ]; then
        print_success "Packaged ${CHAINCODE_NAME} as ${package_file}"
    else
        print_error "Failed to package ${CHAINCODE_NAME}"
        return 1
    fi
}

# =============================================================================
# Chaincode Installation
# =============================================================================

install_on_org() {
    local ORG=$1

    # Find latest package
    local latest_package=$(ls -t ${CHAINCODE_NAME}_*.tar.gz 2>/dev/null | head -1)

    if [ -z "$latest_package" ]; then
        print_error "No package file found. Run 'source ./deploy_chaincode.sh package' first."
        return 1
    fi

    print_info "Installing ${latest_package} on ${ORG}..."

    # Switch context
    switch_to_org "${ORG}"
    if [ $? -ne 0 ]; then return 1; fi

    # Install and capture output
    local install_output
    install_output=$(peer lifecycle chaincode install "${latest_package}" 2>&1)
    local install_status=$?

    echo "$install_output"

    if [ $install_status -eq 0 ]; then
        # Extract package ID
        local package_id=$(echo "$install_output" | grep -oP 'Chaincode code package identifier: \K.*')

        if [ ! -z "$package_id" ]; then
            export PACKAGE_ID="$package_id"
            print_success "PACKAGE_ID=${PACKAGE_ID}"
        fi

        print_success "${CHAINCODE_NAME} installed on ${ORG}"
    else
        print_error "Failed to install ${CHAINCODE_NAME} on ${ORG}"
        return 1
    fi
}

install_on_all_orgs() {
    print_header "Installing Chaincode on All 7 Organizations"

    cd "${PROJECT_ROOT}"

    local latest_package=$(ls -t ${CHAINCODE_NAME}_*.tar.gz 2>/dev/null | head -1)
    if [ -z "$latest_package" ]; then
        print_error "No package file found. Run 'source ./deploy_chaincode.sh package' first."
        return 1
    fi

    print_info "Package: ${latest_package}"
    echo ""

    for ORG in "${ALL_ORGS[@]}"; do
        print_header "Installing on ${ORG}"
        echo -e "${YELLOW}Press Enter to install on ${ORG}...${NC}"
        read -r
        install_on_org "${ORG}"
        echo ""
    done

    print_success "Installation complete on all 7 organizations!"
    print_info "PACKAGE_ID: ${PACKAGE_ID}"
    echo ""
    print_warning "Next step: source ./deploy_chaincode.sh deploy"
}

# =============================================================================
# Query Installed Chaincode
# =============================================================================

query_installed() {
    local ORG=$1

    # Map shorthand to full org name
    case "$ORG" in
        ngo)          ORG="NGOOrg" ;;
        validator)    ORG="ValidatorOrg" ;;
        manufacturer) ORG="ManufacturerOrg" ;;
        warehouse)    ORG="WarehouseOrg" ;;
        distributor)  ORG="DistributorOrg" ;;
        retailer)     ORG="RetailerOrg" ;;
        customer)     ORG="CustomerOrg" ;;
    esac

    switch_to_org "${ORG}"
    print_info "Querying installed chaincodes on ${ORG}..."
    peer lifecycle chaincode queryinstalled
}

# =============================================================================
# Approve Chaincode
# =============================================================================

approve_for_org() {
    local ORG=$1
    local sequence=$2
    local version=$3

    switch_to_org "${ORG}"
    if [ $? -ne 0 ]; then return 1; fi

    print_info "Approving for ${ORG} (version: ${version}, sequence: ${sequence})..."

    peer lifecycle chaincode approveformyorg \
        -o "${ORDERER_URL}" \
        --channelID "${CHANNEL_NAME}" \
        --name "${CHAINCODE_NAME}" \
        --version "${version}" \
        --package-id "${PACKAGE_ID}" \
        --sequence "${sequence}"

    if [ $? -eq 0 ]; then
        print_success "Approved for ${ORG}"
    else
        print_error "Failed to approve for ${ORG}"
        return 1
    fi
}

approve_on_all_orgs() {
    local sequence=$1
    local version=$2

    print_header "Approving Chaincode on All Organizations"

    if [ -z "$PACKAGE_ID" ]; then
        print_error "PACKAGE_ID is not set. Run install first."
        return 1
    fi

    print_info "PACKAGE_ID: ${PACKAGE_ID}"
    print_info "Version: ${version}, Sequence: ${sequence}"
    echo ""

    for ORG in "${ALL_ORGS[@]}"; do
        print_header "Approving on ${ORG}"
        echo -e "${YELLOW}Press Enter to approve on ${ORG}...${NC}"
        read -r
        approve_for_org "${ORG}" "${sequence}" "${version}"
        echo ""
    done

    print_success "Approval complete on all 7 organizations!"
}

# =============================================================================
# Commit Chaincode
# =============================================================================

commit_chaincode() {
    local sequence=$1
    local version=$2

    print_header "Committing Chaincode to Channel"

    switch_to_org "NGOOrg"

    print_info "Committing ${CHAINCODE_NAME} (version: ${version}, sequence: ${sequence})..."

    # Build --peerAddresses for all 7 orgs
    peer lifecycle chaincode commit \
        -o "${ORDERER_URL}" \
        --channelID "${CHANNEL_NAME}" \
        --name "${CHAINCODE_NAME}" \
        --version "${version}" \
        --sequence "${sequence}" \
        --peerAddresses ngoorgpeer-api.127-0-0-1.nip.io:9090 \
        --peerAddresses validatororgpeer-api.127-0-0-1.nip.io:9090 \
        --peerAddresses manufacturerorgpeer-api.127-0-0-1.nip.io:9090 \
        --peerAddresses warehouseorgpeer-api.127-0-0-1.nip.io:9090 \
        --peerAddresses distributororgpeer-api.127-0-0-1.nip.io:9090 \
        --peerAddresses retailerorgpeer-api.127-0-0-1.nip.io:9090 \
        --peerAddresses customerorgpeer-api.127-0-0-1.nip.io:9090

    if [ $? -eq 0 ]; then
        print_success "Successfully committed ${CHAINCODE_NAME} (v${version}, seq${sequence})"
        echo ""
        print_success "DEPLOYMENT COMPLETE!"
        echo ""
        print_info "Test: source ./deploy_chaincode.sh test"
    else
        print_error "Failed to commit ${CHAINCODE_NAME}"
        return 1
    fi
}

# =============================================================================
# Deploy (Approve + Commit)
# =============================================================================

deploy_chaincode() {
    print_header "Deploying Supplychain Chaincode"

    cd "${PROJECT_ROOT}"

    if [ -z "$PACKAGE_ID" ]; then
        print_error "PACKAGE_ID is not set. Run install first."
        return 1
    fi

    local version="1"
    local sequence="1"

    # Check if already committed
    switch_to_org "NGOOrg"
    committed_info=$(peer lifecycle chaincode querycommitted --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}" 2>/dev/null)

    if [ $? -eq 0 ]; then
        print_warning "Chaincode already committed. Auto-incrementing..."
        current_version=$(echo "$committed_info" | grep -oP 'Version: \K[0-9]+' | head -1)
        current_sequence=$(echo "$committed_info" | grep -oP 'Sequence: \K[0-9]+' | head -1)
        version=$((current_version + 1))
        sequence=$((current_sequence + 1))
        print_info "Current: v${current_version} seq${current_sequence} → New: v${version} seq${sequence}"
    else
        print_info "No committed chaincode found. Initial deployment."
    fi

    # Approve on all orgs
    approve_on_all_orgs "${sequence}" "${version}"

    # Check readiness
    echo ""
    check_commit_readiness

    # Commit
    echo ""
    commit_chaincode "${sequence}" "${version}"
}

# =============================================================================
# Upgrade (Interactive)
# =============================================================================

upgrade_chaincode() {
    print_header "Interactive Chaincode Upgrade"

    cd "${PROJECT_ROOT}"

    echo ""
    read -p "Repackage chaincode? (y/n): " repackage_choice
    local install_mandatory=false

    if [[ "$repackage_choice" == "y" || "$repackage_choice" == "Y" ]]; then
        package_chaincode
        if [ $? -ne 0 ]; then return 1; fi
        install_mandatory=true
    fi

    local perform_install=false
    if [ "$install_mandatory" = true ]; then
        print_warning "Repackaged → re-installation is MANDATORY."
        perform_install=true
    else
        read -p "Re-install on all orgs? (y/n): " install_choice
        if [[ "$install_choice" == "y" || "$install_choice" == "Y" ]]; then
            perform_install=true
        fi
    fi

    if [ "$perform_install" = true ]; then
        install_on_all_orgs
        if [ $? -ne 0 ]; then return 1; fi
    fi

    echo ""
    read -p "Proceed with deployment (Approve & Commit)? (y/n): " deploy_choice
    if [[ "$deploy_choice" != "y" && "$deploy_choice" != "Y" ]]; then
        print_info "Deployment skipped."
        return 0
    fi

    if [ -z "$PACKAGE_ID" ]; then
        print_error "PACKAGE_ID is not set."
        return 1
    fi

    # Auto-increment
    switch_to_org "NGOOrg"
    committed_info=$(peer lifecycle chaincode querycommitted --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}" 2>/dev/null)

    if [ $? -ne 0 ]; then
        print_error "No committed chaincode found. Use 'deploy' for initial deployment."
        return 1
    fi

    current_version=$(echo "$committed_info" | grep -oP 'Version: \K[0-9]+' | head -1)
    current_sequence=$(echo "$committed_info" | grep -oP 'Sequence: \K[0-9]+' | head -1)
    new_version=$((current_version + 1))
    new_sequence=$((current_sequence + 1))

    print_info "Upgrading: v${current_version} seq${current_sequence} → v${new_version} seq${new_sequence}"

    approve_on_all_orgs "${new_sequence}" "${new_version}"
    echo ""
    check_commit_readiness
    echo ""
    commit_chaincode "${new_sequence}" "${new_version}"
}

# =============================================================================
# Query Functions
# =============================================================================

query_committed() {
    print_header "Querying Committed Chaincode"
    cd "${PROJECT_ROOT}"
    switch_to_org "NGOOrg"
    peer lifecycle chaincode querycommitted --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}"
}

check_commit_readiness() {
    print_header "Checking Commit Readiness"
    switch_to_org "NGOOrg"

    committed_info=$(peer lifecycle chaincode querycommitted --channelID "${CHANNEL_NAME}" --name "${CHAINCODE_NAME}" 2>/dev/null)
    if [ $? -eq 0 ]; then
        current_sequence=$(echo "$committed_info" | grep -oP 'Sequence: \K[0-9]+' | head -1)
        sequence=$((current_sequence + 1))
    else
        sequence=1
    fi

    print_info "Checking readiness for sequence ${sequence}..."
    peer lifecycle chaincode checkcommitreadiness \
        --channelID "${CHANNEL_NAME}" \
        --name "${CHAINCODE_NAME}" \
        --version "${sequence}" \
        --sequence "${sequence}"
}

# =============================================================================
# Test Chaincode
# =============================================================================

test_chaincode() {
    print_header "Testing Supplychain Chaincode"

    cd "${PROJECT_ROOT}"
    switch_to_org "NGOOrg"

    local test_id="ARTISAN_TEST_$(date +%s)"

    print_info "Registering test artisan: ${test_id}"

    peer chaincode invoke \
        -o ${ORDERER_URL} \
        -C ${CHANNEL_NAME} \
        -n ${CHAINCODE_NAME} \
        -c "{\"function\":\"RegisterArtisan\",\"Args\":[\"${test_id}\",\"Test Artisan\",\"Pottery\",\"Jaipur\",\"QmTestCID\",\"hash123\"]}" \
        --peerAddresses ngoorgpeer-api.127-0-0-1.nip.io:9090

    if [ $? -eq 0 ]; then
        print_success "Test artisan registered!"
        echo ""
        print_info "Querying artisan..."
        sleep 2
        peer chaincode query \
            -C ${CHANNEL_NAME} \
            -n ${CHAINCODE_NAME} \
            -c "{\"function\":\"GetArtisan\",\"Args\":[\"${test_id}\"]}"
    else
        print_error "Test failed"
    fi
}

# =============================================================================
# Help
# =============================================================================

show_help() {
    cat << EOF

${CYAN}=============================================================================
ParamparaChain - Chaincode Deployment Tool
7 Organizations, Single Channel (supplychain-channel)
=============================================================================${NC}

${GREEN}COMMANDS:${NC}
  package              Package chaincode (auto-version)
  install              Install on all 7 organizations
  deploy               Full deployment (approve + commit)
  upgrade              Upgrade chaincode (interactive)
  query-committed      Query committed chaincode
  check-readiness      Check commit readiness
  query-installed <org> Query installed (ngo|validator|manufacturer|warehouse|distributor|retailer|customer)
  switch <org>         Switch org context
  test                 Test RegisterArtisan function
  help                 Show this help

${YELLOW}WORKFLOW:${NC}
  1. source ./deploy_chaincode.sh package
  2. source ./deploy_chaincode.sh install
  3. source ./deploy_chaincode.sh deploy
  4. source ./deploy_chaincode.sh test

${YELLOW}ORGANIZATIONS:${NC}
  NGOOrg, ValidatorOrg, ManufacturerOrg, WarehouseOrg,
  DistributorOrg, RetailerOrg, CustomerOrg

EOF
}

# =============================================================================
# Main Command Handler
# =============================================================================

case "$1" in
    package)
        package_chaincode
        ;;
    install)
        install_on_all_orgs
        ;;
    deploy)
        deploy_chaincode
        ;;
    upgrade)
        upgrade_chaincode
        ;;
    query-committed)
        query_committed
        ;;
    check-readiness)
        check_commit_readiness
        ;;
    query-installed)
        if [ -z "$2" ]; then
            print_error "Specify org: ngo|validator|manufacturer|warehouse|distributor|retailer|customer"
            return 1
        fi
        query_installed "$2"
        ;;
    switch)
        if [ -z "$2" ]; then
            print_error "Specify org: ngo|validator|manufacturer|warehouse|distributor|retailer|customer"
            return 1
        fi
        case "$2" in
            ngo)          switch_to_org "NGOOrg" ;;
            validator)    switch_to_org "ValidatorOrg" ;;
            manufacturer) switch_to_org "ManufacturerOrg" ;;
            warehouse)    switch_to_org "WarehouseOrg" ;;
            distributor)  switch_to_org "DistributorOrg" ;;
            retailer)     switch_to_org "RetailerOrg" ;;
            customer)     switch_to_org "CustomerOrg" ;;
            *)
                print_error "Invalid org: $2"
                print_info "Valid: ngo|validator|manufacturer|warehouse|distributor|retailer|customer"
                return 1
                ;;
        esac
        ;;
    test)
        test_chaincode
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Invalid command: $1"
        print_info "Run 'source ./deploy_chaincode.sh help' for usage"
        return 1
        ;;
esac