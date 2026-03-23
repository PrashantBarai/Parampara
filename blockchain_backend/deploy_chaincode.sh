#!/bin/bash
#
# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║       PARAMPARA HYPERLEDGER FABRIC - CHAINCODE DEPLOYMENT SCRIPT          ║
# ╠═══════════════════════════════════════════════════════════════════════════╣
# ║  Purpose: Automate chaincode lifecycle management across 7 organizations  ║
# ╚═══════════════════════════════════════════════════════════════════════════╝
#
# ┌───────────────────────────────────────────────────────────────────────────┐
# │                         PREREQUISITES                                      │
# └───────────────────────────────────────────────────────────────────────────┘
#
#   1. Start the MicroFab network:
#      export MICROFAB_CONFIG=$(cat MICROFAB.txt)
#      docker run --name microfab -e MICROFAB_CONFIG -p 9090:9090 ibmcom/ibp-microfab
#
#   2. Generate wallets, gateways, and MSP configs:
#      curl -s http://console.127-0-0-1.nip.io:9090/ak/api/v1/components | weft microfab -w ./_wallets -p ./_gateways -m ./_msp -f
#
#   3. Install Fabric binaries (peer, configtxgen, etc.):
#      curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh | bash -s -- binary
#
# ┌───────────────────────────────────────────────────────────────────────────┐
# │                    QUICK START - FIRST TIME SETUP                         │
# └───────────────────────────────────────────────────────────────────────────┘
#
#   Run these 3 commands in order (after prerequisites):
#
#   Step 1: Package chaincode (creates .tgz file)
#   $ source ./deploy_chaincode.sh package
#
#   Step 2: Install chaincode on ALL organizations (auto-switches orgs)
#   $ source ./deploy_chaincode.sh global-install
#   → Press Enter to proceed with each org, 's' to skip, 'q' to quit
#
#   Step 3: Deploy chaincode on ALL organizations (approve + commit)
#   $ source ./deploy_chaincode.sh global-deploy
#   → Press Enter to proceed with each org, 's' to skip, 'q' to quit
#
#   ✅ Done! Chaincode is now active on the network.
#
# ┌───────────────────────────────────────────────────────────────────────────┐
# │                    UPGRADE WORKFLOW - UPDATE CHAINCODE                    │
# └───────────────────────────────────────────────────────────────────────────┘
#
#   Step 1: Package the updated chaincode (auto-increments version)
#   $ source ./deploy_chaincode.sh package supplychain
#
#   Step 2: Upgrade across ALL organizations
#   $ source ./deploy_chaincode.sh global-upgrade supplychain
#
# ┌───────────────────────────────────────────────────────────────────────────┐
# │                         INTERACTIVE PROMPTS                               │
# └───────────────────────────────────────────────────────────────────────────┘
#
#   The global commands show what they're about to do and wait for input:
#
#   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#   NEXT ACTION: Switch to ManufacturerOrg and install: supplychain
#   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#     [Enter] Proceed  |  [s] Skip  |  [q] Quit
#
#   - Press ENTER → Execute the action and continue
#   - Press 's'   → Skip this step and move to next
#   - Press 'q'   → Quit the entire automation
#
# ┌───────────────────────────────────────────────────────────────────────────┐
# │                    RETRY ON ERROR (Auto-Prompt)                            │
# └───────────────────────────────────────────────────────────────────────────┘
#
#   If any step fails, the script will prompt:
#     [r] Retry this step  (default - just press Enter)
#     [c] Continue / skip
#     [q] Quit
#
#   This applies to: chaincode install, approve, and commit operations.
#
# ┌───────────────────────────────────────────────────────────────────────────┐
# │                         ALL AVAILABLE COMMANDS                            │
# └───────────────────────────────────────────────────────────────────────────┘
#
#   GLOBAL AUTOMATED COMMANDS (Recommended):
#   ─────────────────────────────────────────
#   global-install              Install chaincode on ALL orgs
#   global-deploy               Initial deploy on ALL orgs (FIRST TIME ONLY)
#   global-upgrade <chaincode>  Upgrade chaincode across ALL orgs
#
#   MANUAL COMMANDS:
#   ──────────────────────────────────────────
#   switch <org>                Switch to organization context
#                               Options: ngoorg, manufacturerorg, warehouseorg,
#                                        distributororg, retailerorg, customerorg
#   package                     Package chaincode (supplychain)
#   package <name>              Package specific chaincode
#   install <org>               Install chaincode on specific org
#   deploy <org>                Deploy for specific org (first time)
#   upgrade <chaincode>         Upgrade chaincode (NGOOrg as owner)
#   sync-upgrade <chaincode>    Sync upgrade to other orgs (if deploy was used)
#   query                       Query all committed chaincodes
#   query-installed             Query installed chaincodes on current peer
#   pending <org>               Show pending approvals for an org
#   check-readiness             Check commit readiness
#   approve-chaincode <org> <cc> <channel>  Cross-org approval
#   help                        Show usage information
#
# ┌───────────────────────────────────────────────────────────────────────────┐
# │                      NETWORK TOPOLOGY REFERENCE                           │
# └───────────────────────────────────────────────────────────────────────────┘
#
#   Organizations:
#   ──────────────
#   NGOOrg           → Uses: supplychain (OWNER - approves+commits first)
#   ValidatorOrg     → Uses: supplychain (endorser - GI cert verification)
#   ManufacturerOrg  → Uses: supplychain (endorser)
#   WarehouseOrg     → Uses: supplychain (endorser)
#   DistributorOrg   → Uses: supplychain (endorser)
#   RetailerOrg      → Uses: supplychain (endorser)
#   CustomerOrg      → Uses: supplychain (endorser)
#
#   Channel:
#   ────────
#   supplychain-channel → NGOOrg, ValidatorOrg, ManufacturerOrg, WarehouseOrg,
#                         DistributorOrg, RetailerOrg, CustomerOrg
#
#   Chaincode Installation per Org:
#   ───────────────────────────────
#   All 7 organizations: supplychain
#
# ┌───────────────────────────────────────────────────────────────────────────┐
# │              APPROVE-CHAINCODE - Cross-Org Approvals                      │
# └───────────────────────────────────────────────────────────────────────────┘
#
# After NGOOrg upgrades supplychain, ALL other orgs must approve:
#   source ./deploy_chaincode.sh approve-chaincode validatororg supplychain supplychain-channel
#   source ./deploy_chaincode.sh approve-chaincode manufacturerorg supplychain supplychain-channel
#   source ./deploy_chaincode.sh approve-chaincode warehouseorg supplychain supplychain-channel
#   source ./deploy_chaincode.sh approve-chaincode distributororg supplychain supplychain-channel
#   source ./deploy_chaincode.sh approve-chaincode retailerorg supplychain supplychain-channel
#   source ./deploy_chaincode.sh approve-chaincode customerorg supplychain supplychain-channel
#
# =============================================================================

# Disable exit on error for better error handling when sourcing
# set -e

# =============================================================================
# Global Configuration Variables
# =============================================================================
ORDERER_URL="orderer-api.127-0-0-1.nip.io:9090"
MSP_BASE_PATH="/home/luminalcore/Academics/Hackathon/RGIT_Recursion_7/Parampara/blockchain_backend/_msp"
CONTRACTS_BASE_PATH="./contracts/supplychain"
CHANNEL_NAME="supplychain-channel"
CHAINCODE_NAME="supplychain"

# All organizations in order
ALL_ORGS=("ngoorg" "validatororg" "manufacturerorg" "warehouseorg" "distributororg" "retailerorg" "customerorg")
ALL_ORG_NAMES=("NGOOrg" "ValidatorOrg" "ManufacturerOrg" "WarehouseOrg" "DistributorOrg" "RetailerOrg" "CustomerOrg")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_section() {
    echo ""
    echo -e "${YELLOW}=============================================================================${NC}"
    echo -e "${YELLOW} $1${NC}"
    echo -e "${YELLOW}=============================================================================${NC}"
}

# =============================================================================
# Organization Context Switching Functions
# =============================================================================

# Setup Fabric environment paths
setup_fabric_env() {
    export PATH=$PATH:${PWD}/bin
    export FABRIC_CFG_PATH=${PWD}/config
    log_info "Fabric environment paths configured"
}

# Switch to NGOOrg context
switch_to_ngoorg() {
    log_info "Switching to NGOOrg context..."
    export CORE_PEER_LOCALMSPID=NGOOrgMSP
    export CORE_PEER_MSPCONFIGPATH=${MSP_BASE_PATH}/NGOOrg/ngoorgadmin/msp
    export CORE_PEER_ADDRESS=ngoorgpeer-api.127-0-0-1.nip.io:9090
    setup_fabric_env
    log_success "Now using NGOOrg identity"
}

# Switch to ValidatorOrg context
switch_to_validatororg() {
    log_info "Switching to ValidatorOrg context..."
    export CORE_PEER_LOCALMSPID=ValidatorOrgMSP
    export CORE_PEER_MSPCONFIGPATH=${MSP_BASE_PATH}/ValidatorOrg/validatororgadmin/msp
    export CORE_PEER_ADDRESS=validatororgpeer-api.127-0-0-1.nip.io:9090
    setup_fabric_env
    log_success "Now using ValidatorOrg identity"
}

# Switch to ManufacturerOrg context
switch_to_manufacturerorg() {
    log_info "Switching to ManufacturerOrg context..."
    export CORE_PEER_LOCALMSPID=ManufacturerOrgMSP
    export CORE_PEER_MSPCONFIGPATH=${MSP_BASE_PATH}/ManufacturerOrg/manufacturerorgadmin/msp
    export CORE_PEER_ADDRESS=manufacturerorgpeer-api.127-0-0-1.nip.io:9090
    setup_fabric_env
    log_success "Now using ManufacturerOrg identity"
}

# Switch to WarehouseOrg context
switch_to_warehouseorg() {
    log_info "Switching to WarehouseOrg context..."
    export CORE_PEER_LOCALMSPID=WarehouseOrgMSP
    export CORE_PEER_MSPCONFIGPATH=${MSP_BASE_PATH}/WarehouseOrg/warehouseorgadmin/msp
    export CORE_PEER_ADDRESS=warehouseorgpeer-api.127-0-0-1.nip.io:9090
    setup_fabric_env
    log_success "Now using WarehouseOrg identity"
}

# Switch to DistributorOrg context
switch_to_distributororg() {
    log_info "Switching to DistributorOrg context..."
    export CORE_PEER_LOCALMSPID=DistributorOrgMSP
    export CORE_PEER_MSPCONFIGPATH=${MSP_BASE_PATH}/DistributorOrg/distributororgadmin/msp
    export CORE_PEER_ADDRESS=distributororgpeer-api.127-0-0-1.nip.io:9090
    setup_fabric_env
    log_success "Now using DistributorOrg identity"
}

# Switch to RetailerOrg context
switch_to_retailerorg() {
    log_info "Switching to RetailerOrg context..."
    export CORE_PEER_LOCALMSPID=RetailerOrgMSP
    export CORE_PEER_MSPCONFIGPATH=${MSP_BASE_PATH}/RetailerOrg/retailerorgadmin/msp
    export CORE_PEER_ADDRESS=retailerorgpeer-api.127-0-0-1.nip.io:9090
    setup_fabric_env
    log_success "Now using RetailerOrg identity"
}

# Switch to CustomerOrg context
switch_to_customerorg() {
    log_info "Switching to CustomerOrg context..."
    export CORE_PEER_LOCALMSPID=CustomerOrgMSP
    export CORE_PEER_MSPCONFIGPATH=${MSP_BASE_PATH}/CustomerOrg/customerorgadmin/msp
    export CORE_PEER_ADDRESS=customerorgpeer-api.127-0-0-1.nip.io:9090
    setup_fabric_env
    log_success "Now using CustomerOrg identity"
}

# Generic org switcher
switch_org() {
    local org=$1
    case $org in
        ngoorg)          switch_to_ngoorg ;;
        manufacturerorg) switch_to_manufacturerorg ;;
        warehouseorg)    switch_to_warehouseorg ;;
        distributororg)  switch_to_distributororg ;;
        retailerorg)     switch_to_retailerorg ;;
        customerorg)     switch_to_customerorg ;;
        *)
            log_error "Unknown organization: $org"
            echo "Valid options: ngoorg, manufacturerorg, warehouseorg, distributororg, retailerorg, customerorg"
            return 1
            ;;
    esac
}

# =============================================================================
# Chaincode Packaging Functions
# =============================================================================

# Get next package version by checking existing .tgz files
get_next_package_version() {
    local chaincode_name=$1
    local max_version=0
    
    shopt -s nullglob
    for file in ${chaincode_name}_*.tgz; do
        if [ -f "$file" ]; then
            version=$(echo "$file" | sed -n "s/${chaincode_name}_\([0-9]\+\)\.tgz/\1/p")
            if [ -n "$version" ] && [ "$version" -gt "$max_version" ]; then
                max_version=$version
            fi
        fi
    done
    shopt -u nullglob
    
    echo $((max_version + 1))
}

# Package a single chaincode with auto-incrementing version
package_chaincode() {
    local chaincode_name=$1
    local contract_path="${CONTRACTS_BASE_PATH}/${chaincode_name}"
    
    local version=$(get_next_package_version "$chaincode_name")
    local package_file="${chaincode_name}_${version}.tgz"
    local label="${chaincode_name}_${version}"
    
    log_section "Packaging ${chaincode_name} chaincode"
    log_info "Version: ${version}"
    log_info "Package: ${package_file}"
    log_info "Label: ${label}"
    log_info "Path: ${contract_path}"
    
    if [ ! -d "$contract_path" ]; then
        log_error "Contract path does not exist: $contract_path"
        return 1
    fi
    
    peer lifecycle chaincode package "$package_file" \
        --path "$contract_path" \
        --lang golang \
        --label "$label"
    
    if [ $? -eq 0 ]; then
        log_success "Packaged ${chaincode_name} as ${package_file}"
        echo "$package_file"
    else
        log_error "Failed to package ${chaincode_name}"
        return 1
    fi
}

# Package all chaincodes
package_all_chaincodes() {
    log_section "Packaging All Chaincodes"
    setup_fabric_env
    
    local supplychain_pkg=$(package_chaincode "supplychain")
    
    log_success "All chaincodes packaged successfully!"
    echo ""
    log_info "Package files created:"
    log_info "  - $supplychain_pkg"
}

# =============================================================================
# Chaincode Installation Functions
# =============================================================================

# Get latest package file for a chaincode
get_latest_package() {
    local chaincode_name=$1
    ls -t ${chaincode_name}_*.tgz 2>/dev/null | head -1
}

# Install chaincode on current peer and prompt for package ID
install_chaincode_interactive() {
    local chaincode_name=$1
    local package_file=$2
    
    local version=$(echo "$package_file" | sed -n "s/${chaincode_name}_\([0-9]\+\)\.tgz/\1/p")
    
    echo ""
    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC} ${YELLOW}INSTALLING CHAINCODE PACKAGE${NC}                                         ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC} Chaincode:     ${GREEN}${chaincode_name}${NC}"
    echo -e "${CYAN}│${NC} Version:       ${GREEN}${version}${NC}"
    echo -e "${CYAN}│${NC} Package File:  ${GREEN}${package_file}${NC}"
    echo -e "${CYAN}│${NC} Organization:  ${GREEN}${CORE_PEER_LOCALMSPID}${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────┘${NC}"
    echo ""
    
    log_section "Installing ${chaincode_name} chaincode"
    
    if [ -z "$package_file" ] || [ ! -f "$package_file" ]; then
        log_error "Package file not found: $package_file"
        log_info "Run 'source ./deploy_chaincode.sh package' first to create packages"
        return 1
    fi
    
    log_info "Installing ${package_file} on current peer..."
    
    local max_auto_retries=3
    local retry_count=0
    
    while true; do
        local install_output=$(peer lifecycle chaincode install "$package_file" 2>&1)
        local install_status=$?
        
        echo "$install_output"
        
        if echo "$install_output" | grep -q "already successfully installed"; then
            log_warning "${chaincode_name} already installed"
            
            local package_id=$(echo "$install_output" | grep -oP "package ID '\K[^']+")
            if [ -z "$package_id" ]; then
                log_info "Querying installed chaincodes to get package ID..."
                local query_output=$(peer lifecycle chaincode queryinstalled 2>&1)
                package_id=$(echo "$query_output" | grep "Label: ${chaincode_name}_" | head -1 | grep -oP "Package ID: \K[^,]+")
            fi
            
            if [ ! -z "$package_id" ]; then
                log_info "Package ID: ${package_id}"
                local var_name="${chaincode_name^^}_CC_PACKAGE_ID"
                export ${var_name}="${package_id}"
                log_success "Auto-exported: ${var_name}=${package_id}"
                echo -e "${CYAN}export ${var_name}=${package_id}${NC}"
                echo ""
                read -p "Press Enter to continue to next chaincode..."
            else
                log_error "Could not extract package ID for ${chaincode_name}"
                return 1
            fi
            return 0
            
        elif [ $install_status -eq 0 ]; then
            log_success "${chaincode_name} installed successfully!"
            local package_id=$(echo "$install_output" | grep -o 'Chaincode code package identifier: .*' | cut -d ' ' -f 5)
            if [ ! -z "$package_id" ]; then
                log_info "Package ID: ${package_id}"
                local var_name="${chaincode_name^^}_CC_PACKAGE_ID"
                export ${var_name}="${package_id}"
                log_success "Auto-exported: ${var_name}=${package_id}"
                echo -e "${CYAN}export ${var_name}=${package_id}${NC}"
                echo ""
                read -p "Press Enter to continue to next chaincode..."
            fi
            return 0
        else
            retry_count=$((retry_count + 1))
            log_error "Failed to install ${chaincode_name} (attempt ${retry_count})"
            echo ""
            echo -e "${YELLOW}What would you like to do?${NC}"
            echo -e "  ${GREEN}[r]${NC} Retry installation"
            echo -e "  ${YELLOW}[c]${NC} Continue / skip"
            echo -e "  ${RED}[q]${NC} Quit"
            echo -n "  Your choice: "
            
            read -r retry_choice
            case $retry_choice in
                r|R|"") log_info "Retrying..."; continue ;;
                q|Q) return 1 ;;
                c|C|*) return 1 ;;
            esac
        fi
    done
}

# Install chaincode on a specific org
install_on_org() {
    local org=$1
    local org_name=$2
    
    log_section "Installing Chaincodes on ${org_name}"
    log_info "Required chaincodes: supplychain"
    switch_org "$org"
    
    local supplychain_pkg=$(get_latest_package "supplychain")
    install_chaincode_interactive "supplychain" "$supplychain_pkg"
    
    log_success "${org_name} installation complete!"
    log_info "Installed: supplychain"
}

# Install on all orgs sequentially with prompts
install_all_orgs() {
    log_section "Installing Chaincodes on All Organizations"
    
    for i in "${!ALL_ORGS[@]}"; do
        echo ""
        read -p "Install on ${ALL_ORG_NAMES[$i]}? (y/n): " confirm
        if [ "$confirm" == "y" ]; then
            install_on_org "${ALL_ORGS[$i]}" "${ALL_ORG_NAMES[$i]}"
        fi
    done
    
    log_success "Installation on all orgs complete!"
}

# =============================================================================
# Sequence and Version Detection Functions
# =============================================================================

get_committed_sequence() {
    local channel=$1
    local chaincode_name=$2
    
    local result=$(peer lifecycle chaincode querycommitted \
        --channelID ${channel} \
        --name ${chaincode_name} \
        --output json 2>/dev/null || echo "")
    
    if [ -z "$result" ] || [ "$result" == "" ]; then
        echo "0"; return
    fi
    
    local sequence=$(echo "$result" | jq -r '.sequence // 0' 2>/dev/null || echo "0")
    if [ -z "$sequence" ] || [ "$sequence" == "null" ]; then echo "0"; else echo "$sequence"; fi
}

get_committed_version() {
    local channel=$1
    local chaincode_name=$2
    
    local result=$(peer lifecycle chaincode querycommitted \
        --channelID ${channel} \
        --name ${chaincode_name} \
        --output json 2>/dev/null || echo "")
    
    if [ -z "$result" ] || [ "$result" == "" ]; then
        echo "0"; return
    fi
    
    local version=$(echo "$result" | jq -r '.version // "0"' 2>/dev/null || echo "0")
    if [ -z "$version" ] || [ "$version" == "null" ]; then echo "0"; else echo "$version"; fi
}

get_next_sequence() {
    local channel=$1
    local chaincode_name=$2
    local current=$(get_committed_sequence "$channel" "$chaincode_name")
    echo $((current + 1))
}

get_next_version() {
    local channel=$1
    local chaincode_name=$2
    local current=$(get_committed_version "$channel" "$chaincode_name")
    
    if [ "$current" == "0" ] || [ -z "$current" ]; then
        echo "1"
    elif [[ "$current" =~ ^[0-9]+$ ]]; then
        echo $((current + 1))
    else
        echo "$current"
    fi
}

# =============================================================================
# Approve and Commit Functions
# =============================================================================

approve_chaincode() {
    local channel=$1
    local chaincode_name=$2
    local package_id=$3
    local sequence=${4:-}
    local version=${5:-}
    
    if [ -z "$sequence" ]; then
        sequence=$(get_next_sequence "$channel" "$chaincode_name")
    fi
    if [ -z "$version" ]; then
        version=$(get_next_version "$channel" "$chaincode_name")
    fi
    
    echo ""
    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC} ${YELLOW}APPROVING CHAINCODE${NC}                                                  ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC} Chaincode:  ${GREEN}${chaincode_name}${NC}"
    echo -e "${CYAN}│${NC} Version:    ${GREEN}${version}${NC}"
    echo -e "${CYAN}│${NC} Sequence:   ${GREEN}${sequence}${NC}"
    echo -e "${CYAN}│${NC} Channel:    ${GREEN}${channel}${NC}"
    echo -e "${CYAN}│${NC} Package ID: ${GREEN}${package_id:0:50}...${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────┘${NC}"
    
    log_info "Approving chaincode '${chaincode_name}' on channel '${channel}'..."
    
    while true; do
        peer lifecycle chaincode approveformyorg \
            -o ${ORDERER_URL} \
            --channelID ${channel} \
            --name ${chaincode_name} \
            --version ${version} \
            --sequence ${sequence} \
            --waitForEvent \
            --package-id ${package_id}
        
        if [ $? -eq 0 ]; then
            log_success "Approved '${chaincode_name}' on '${channel}' (version: ${version}, sequence: ${sequence})"
            break
        else
            log_error "Failed to approve '${chaincode_name}' on '${channel}'"
            echo -e "  ${GREEN}[r]${NC} Retry | ${YELLOW}[c]${NC} Continue | ${RED}[q]${NC} Quit"
            echo -n "  Your choice: "
            read -r choice
            case $choice in
                r|R|"") continue ;;
                q|Q) return 1 ;;
                *) return 1 ;;
            esac
        fi
    done
}

approve_chaincode_smart() {
    local channel=$1
    local chaincode_name=$2
    local package_id=$3
    
    local committed_seq=$(get_committed_sequence "$channel" "$chaincode_name")
    
    if [ "$committed_seq" == "0" ] || [ -z "$committed_seq" ]; then
        log_info "Chaincode '${chaincode_name}' not yet committed on '${channel}'. Using next sequence..."
        approve_chaincode "$channel" "$chaincode_name" "$package_id"
    else
        local version=$(get_committed_version "$channel" "$chaincode_name")
        log_info "Chaincode '${chaincode_name}' already committed. Matching version ${version}, sequence ${committed_seq}..."
        
        while true; do
            peer lifecycle chaincode approveformyorg \
                -o ${ORDERER_URL} \
                --channelID ${channel} \
                --name ${chaincode_name} \
                --version ${version} \
                --sequence ${committed_seq} \
                --waitForEvent \
                --package-id ${package_id}
            
            if [ $? -eq 0 ]; then
                log_success "Approved '${chaincode_name}' on '${channel}' (version: ${version}, sequence: ${committed_seq})"
                break
            else
                log_error "Failed to approve"
                echo -e "  ${GREEN}[r]${NC} Retry | ${YELLOW}[c]${NC} Continue | ${RED}[q]${NC} Quit"
                echo -n "  Your choice: "
                read -r choice
                case $choice in
                    r|R|"") continue ;;
                    q|Q) return 1 ;;
                    *) return 1 ;;
                esac
            fi
        done
    fi
}

commit_chaincode() {
    local channel=$1
    local chaincode_name=$2
    local sequence=${3:-}
    local version=${4:-}
    
    if [ -z "$sequence" ]; then
        sequence=$(get_next_sequence "$channel" "$chaincode_name")
    fi
    if [ -z "$version" ]; then
        version=$(get_next_version "$channel" "$chaincode_name")
    fi
    
    echo ""
    echo -e "${CYAN}┌─────────────────────────────────────────────────────────────────────────┐${NC}"
    echo -e "${CYAN}│${NC} ${YELLOW}COMMITTING CHAINCODE${NC}                                                 ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────────────────────────────────────────────────────────────┤${NC}"
    echo -e "${CYAN}│${NC} Chaincode:  ${GREEN}${chaincode_name}${NC}"
    echo -e "${CYAN}│${NC} Version:    ${GREEN}${version}${NC}"
    echo -e "${CYAN}│${NC} Sequence:   ${GREEN}${sequence}${NC}"
    echo -e "${CYAN}│${NC} Channel:    ${GREEN}${channel}${NC}"
    echo -e "${CYAN}└─────────────────────────────────────────────────────────────────────────┘${NC}"
    
    log_info "Committing chaincode '${chaincode_name}' on channel '${channel}'..."
    
    while true; do
        peer lifecycle chaincode commit \
            -o ${ORDERER_URL} \
            --channelID ${channel} \
            --name ${chaincode_name} \
            --version ${version} \
            --sequence ${sequence}
        
        if [ $? -eq 0 ]; then
            log_success "Committed '${chaincode_name}' on '${channel}' (version: ${version}, sequence: ${sequence})"
            break
        else
            log_error "Failed to commit"
            echo -e "  ${GREEN}[r]${NC} Retry | ${YELLOW}[c]${NC} Continue | ${RED}[q]${NC} Quit"
            echo -n "  Your choice: "
            read -r choice
            case $choice in
                r|R|"") continue ;;
                q|Q) return 1 ;;
                *) return 1 ;;
            esac
        fi
    done
}

check_readiness() {
    local channel=$1
    local chaincode_name=$2
    
    local sequence=$(get_next_sequence "$channel" "$chaincode_name")
    local version=$(get_next_version "$channel" "$chaincode_name")
    
    log_info "Checking commit readiness for '${chaincode_name}' on '${channel}'..."
    
    peer lifecycle chaincode checkcommitreadiness \
        --channelID ${channel} \
        --name ${chaincode_name} \
        --version ${version} \
        --sequence ${sequence}
}

# =============================================================================
# Package ID Setup
# =============================================================================

set_package_ids() {
    if [ -z "$SUPPLYCHAIN_CC_PACKAGE_ID" ]; then
        log_warning "SUPPLYCHAIN_CC_PACKAGE_ID not set. Please export it before running."
    fi
}

# =============================================================================
# Deployment Functions
# =============================================================================

# NGOOrg is the owner - it approves and commits first
deploy_ngo_org() {
    log_section "Deploying chaincode for NGOOrg (Owner)"
    switch_to_ngoorg
    
    local current_version=$(get_committed_version "$CHANNEL_NAME" "$CHAINCODE_NAME")
    if [ "$current_version" != "0" ] && [ -n "$current_version" ]; then
        echo ""
        log_error "UPGRADE DETECTED: '${CHAINCODE_NAME}' is already deployed (version: ${current_version})"
        echo ""
        echo -e "${RED}The 'deploy' command is ONLY for initial deployment.${NC}"
        echo -e "${RED}It cannot be used for upgrading existing chaincodes.${NC}"
        echo ""
        echo -e "${GREEN}Please use the correct command:${NC}"
        echo ""
        echo -e "  ${CYAN}For NEW code version:${NC}"
        echo -e "    1. Package:  source ./deploy_chaincode.sh package supplychain"
        echo -e "    2. Install:  source ./deploy_chaincode.sh global-install"
        echo -e "    3. Upgrade:  source ./deploy_chaincode.sh global-upgrade supplychain"
        echo ""
        echo -e "  ${CYAN}If you already upgraded on this org but other orgs need to catch up:${NC}"
        echo -e "    source ./deploy_chaincode.sh sync-upgrade supplychain"
        echo ""
        return 1
    fi
    
    approve_chaincode "$CHANNEL_NAME" "$CHAINCODE_NAME" "$SUPPLYCHAIN_CC_PACKAGE_ID" || return 1
    commit_chaincode "$CHANNEL_NAME" "$CHAINCODE_NAME" || return 1
    
    log_success "NGOOrg deployment complete!"
}

# All other orgs approve (smart - matches committed version)
deploy_endorser_org() {
    local org=$1
    local org_name=$2
    
    log_section "Deploying chaincode for ${org_name} (Endorser)"
    switch_org "$org"
    
    approve_chaincode_smart "$CHANNEL_NAME" "$CHAINCODE_NAME" "$SUPPLYCHAIN_CC_PACKAGE_ID" || return 1
    
    log_success "${org_name} deployment complete!"
}

deploy_all_orgs() {
    log_section "Deploying chaincode for ALL organizations"
    
    # NGOOrg deploys first as owner
    echo ""
    read -p "Deploy for NGOOrg (owner - approve + commit)? (y/n): " confirm
    if [ "$confirm" == "y" ]; then
        deploy_ngo_org
    fi
    
    # All other orgs approve
    local endorser_orgs=("validatororg" "manufacturerorg" "warehouseorg" "distributororg" "retailerorg" "customerorg")
    local endorser_names=("ValidatorOrg" "ManufacturerOrg" "WarehouseOrg" "DistributorOrg" "RetailerOrg" "CustomerOrg")
    
    for i in "${!endorser_orgs[@]}"; do
        echo ""
        read -p "Deploy for ${endorser_names[$i]} (approve)? (y/n): " confirm
        if [ "$confirm" == "y" ]; then
            deploy_endorser_org "${endorser_orgs[$i]}" "${endorser_names[$i]}"
        fi
    done
    
    log_success "All deployments complete!"
}

# =============================================================================
# Global Automated Commands with Interactive Prompts
# =============================================================================

prompt_action() {
    local action_description=$1
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}NEXT ACTION:${NC} $action_description"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  ${GREEN}[Enter]${NC} Proceed  |  ${YELLOW}[s]${NC} Skip  |  ${RED}[q]${NC} Quit"
    echo -n "  Your choice: "
    
    read -r choice
    case $choice in
        q|Q) log_warning "Quitting..."; return 2 ;;
        s|S) log_info "Skipping..."; return 1 ;;
        *) return 0 ;;
    esac
}

# GLOBAL INSTALL
global_install() {
    log_section "GLOBAL INSTALL - Installing Chaincode on ALL Organizations"
    echo -e "${CYAN}This will install supplychain chaincode on each organization's peer.${NC}"
    
    for i in "${!ALL_ORGS[@]}"; do
        prompt_action "Switch to ${ALL_ORG_NAMES[$i]} and install: supplychain"
        local result=$?
        if [ $result -eq 2 ]; then return; fi
        if [ $result -eq 0 ]; then
            install_on_org "${ALL_ORGS[$i]}" "${ALL_ORG_NAMES[$i]}"
        fi
    done
    
    log_success "Global install complete!"
}

# GLOBAL DEPLOY
global_deploy() {
    log_section "GLOBAL DEPLOY - Deploying Chaincode on ALL Organizations"
    echo -e "${CYAN}This will approve and commit supplychain on the network.${NC}"
    
    # NGOOrg first (owner - approve + commit)
    prompt_action "Switch to NGOOrg and deploy supplychain (approve + commit)"
    local result=$?
    if [ $result -eq 2 ]; then return; fi
    if [ $result -eq 0 ]; then
        deploy_ngo_org
    fi
    
    # Remaining orgs (endorsers - approve only)
    local endorser_orgs=("validatororg" "manufacturerorg" "warehouseorg" "distributororg" "retailerorg" "customerorg")
    local endorser_names=("ValidatorOrg" "ManufacturerOrg" "WarehouseOrg" "DistributorOrg" "RetailerOrg" "CustomerOrg")
    
    for i in "${!endorser_orgs[@]}"; do
        prompt_action "Switch to ${endorser_names[$i]} and approve supplychain"
        result=$?
        if [ $result -eq 2 ]; then return; fi
        if [ $result -eq 0 ]; then
            deploy_endorser_org "${endorser_orgs[$i]}" "${endorser_names[$i]}"
        fi
    done
    
    log_success "Global deploy complete!"
}

# GLOBAL UPGRADE
global_upgrade() {
    local chaincode_name=${1:-supplychain}
    
    log_section "GLOBAL UPGRADE - Upgrading '${chaincode_name}' on ALL Organizations"
    
    # Install new package on all orgs
    for i in "${!ALL_ORGS[@]}"; do
        prompt_action "Switch to ${ALL_ORG_NAMES[$i]} and install new ${chaincode_name} package"
        local result=$?
        if [ $result -eq 2 ]; then return; fi
        if [ $result -eq 0 ]; then
            switch_org "${ALL_ORGS[$i]}"
            local pkg=$(get_latest_package "$chaincode_name")
            install_chaincode_interactive "$chaincode_name" "$pkg"
        fi
    done
    
    # NGOOrg approves + commits with new sequence
    prompt_action "Switch to NGOOrg and upgrade ${chaincode_name} (approve + commit with new sequence)"
    local result=$?
    if [ $result -eq 2 ]; then return; fi
    if [ $result -eq 0 ]; then
        switch_to_ngoorg
        approve_chaincode "$CHANNEL_NAME" "$chaincode_name" "$SUPPLYCHAIN_CC_PACKAGE_ID"
        commit_chaincode "$CHANNEL_NAME" "$chaincode_name"
    fi
    
    # Remaining orgs approve with matching sequence
    local endorser_orgs=("validatororg" "manufacturerorg" "warehouseorg" "distributororg" "retailerorg" "customerorg")
    local endorser_names=("ValidatorOrg" "ManufacturerOrg" "WarehouseOrg" "DistributorOrg" "RetailerOrg" "CustomerOrg")
    
    for i in "${!endorser_orgs[@]}"; do
        prompt_action "Switch to ${endorser_names[$i]} and approve upgraded ${chaincode_name}"
        result=$?
        if [ $result -eq 2 ]; then return; fi
        if [ $result -eq 0 ]; then
            switch_org "${endorser_orgs[$i]}"
            approve_chaincode_smart "$CHANNEL_NAME" "$chaincode_name" "$SUPPLYCHAIN_CC_PACKAGE_ID"
        fi
    done
    
    log_success "Global upgrade of '${chaincode_name}' complete!"
}

# =============================================================================
# Sync Upgrade (when deploy was used instead of upgrade)
# =============================================================================

sync_upgrade() {
    local chaincode_name=${1:-supplychain}
    
    log_section "SYNC UPGRADE - Syncing '${chaincode_name}' to remaining organizations"
    echo -e "${CYAN}Use this when NGOOrg already upgraded but other orgs need to catch up.${NC}"
    
    local endorser_orgs=("validatororg" "manufacturerorg" "warehouseorg" "distributororg" "retailerorg" "customerorg")
    local endorser_names=("ValidatorOrg" "ManufacturerOrg" "WarehouseOrg" "DistributorOrg" "RetailerOrg" "CustomerOrg")
    
    for i in "${!endorser_orgs[@]}"; do
        prompt_action "Switch to ${endorser_names[$i]} and sync-approve ${chaincode_name}"
        local result=$?
        if [ $result -eq 2 ]; then return; fi
        if [ $result -eq 0 ]; then
            switch_org "${endorser_orgs[$i]}"
            local pkg=$(get_latest_package "$chaincode_name")
            install_chaincode_interactive "$chaincode_name" "$pkg"
            approve_chaincode_smart "$CHANNEL_NAME" "$chaincode_name" "$SUPPLYCHAIN_CC_PACKAGE_ID"
        fi
    done
    
    log_success "Sync upgrade of '${chaincode_name}' complete!"
}

# =============================================================================
# Pending Approvals Check
# =============================================================================

pending_approvals() {
    local org=$1
    
    if [ -z "$org" ]; then
        log_error "Usage: source ./deploy_chaincode.sh pending <org>"
        return 1
    fi
    
    log_section "Checking Pending Approvals for ${org}"
    switch_org "$org"
    
    log_info "Checking commit readiness for '${CHAINCODE_NAME}' on '${CHANNEL_NAME}'..."
    
    local next_seq=$(get_next_sequence "$CHANNEL_NAME" "$CHAINCODE_NAME")
    local next_ver=$(get_next_version "$CHANNEL_NAME" "$CHAINCODE_NAME")
    
    echo ""
    echo -e "${CYAN}Next expected: version=${next_ver}, sequence=${next_seq}${NC}"
    echo ""
    
    peer lifecycle chaincode checkcommitreadiness \
        --channelID ${CHANNEL_NAME} \
        --name ${CHAINCODE_NAME} \
        --version ${next_ver} \
        --sequence ${next_seq}
    
    echo ""
    log_info "Currently committed:"
    peer lifecycle chaincode querycommitted \
        --channelID ${CHANNEL_NAME} \
        --name ${CHAINCODE_NAME} 2>/dev/null || log_info "(not yet committed)"
}

# =============================================================================
# Query Functions
# =============================================================================

query_committed() {
    log_section "Querying Committed Chaincodes"
    log_info "Channel: ${CHANNEL_NAME}"
    peer lifecycle chaincode querycommitted --channelID ${CHANNEL_NAME}
}

query_installed() {
    log_section "Querying Installed Chaincodes"
    peer lifecycle chaincode queryinstalled
}

# =============================================================================
# Help Function
# =============================================================================

show_help() {
    echo ""
    echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}       ${YELLOW}PARAMPARA - Chaincode Deployment Script${NC}                            ${CYAN}║${NC}"
    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}GLOBAL COMMANDS (Recommended):${NC}"
    echo -e "  source ./deploy_chaincode.sh ${CYAN}package${NC}                    Package chaincode"
    echo -e "  source ./deploy_chaincode.sh ${CYAN}global-install${NC}             Install on ALL orgs"
    echo -e "  source ./deploy_chaincode.sh ${CYAN}global-deploy${NC}              Deploy on ALL orgs"
    echo -e "  source ./deploy_chaincode.sh ${CYAN}global-upgrade${NC} <cc>        Upgrade on ALL orgs"
    echo ""
    echo -e "${GREEN}MANUAL COMMANDS:${NC}"
    echo -e "  source ./deploy_chaincode.sh ${CYAN}switch${NC} <org>               Switch org context"
    echo -e "  source ./deploy_chaincode.sh ${CYAN}install${NC} <org>              Install on specific org"
    echo -e "  source ./deploy_chaincode.sh ${CYAN}deploy${NC} <org>               Deploy on specific org"
    echo -e "  source ./deploy_chaincode.sh ${CYAN}query${NC}                      Query committed chaincodes"
    echo -e "  source ./deploy_chaincode.sh ${CYAN}query-installed${NC}            Query installed chaincodes"
    echo ""
    echo -e "${GREEN}ORGANIZATIONS:${NC}"
    echo -e "  ngoorg, manufacturerorg, warehouseorg, distributororg, retailerorg, customerorg"
    echo ""
}

# =============================================================================
# Main Command Handler
# =============================================================================

case $1 in
    switch)
        switch_org "$2"
        ;;
    package)
        if [ -z "$2" ]; then
            package_all_chaincodes
        else
            setup_fabric_env
            package_chaincode "$2"
        fi
        ;;
    install)
        if [ -z "$2" ]; then
            log_error "Please specify an org: source ./deploy_chaincode.sh install <org>"
            echo "Options: ngoorg, manufacturerorg, warehouseorg, distributororg, retailerorg, customerorg"
        else
            # Find org name
            for i in "${!ALL_ORGS[@]}"; do
                if [ "${ALL_ORGS[$i]}" == "$2" ]; then
                    install_on_org "$2" "${ALL_ORG_NAMES[$i]}"
                    break
                fi
            done
        fi
        ;;
    install-all)
        install_all_orgs
        ;;
    deploy)
        if [ -z "$2" ]; then
            log_error "Please specify an org: source ./deploy_chaincode.sh deploy <org>"
        elif [ "$2" == "ngoorg" ]; then
            deploy_ngo_org
        else
            for i in "${!ALL_ORGS[@]}"; do
                if [ "${ALL_ORGS[$i]}" == "$2" ]; then
                    deploy_endorser_org "$2" "${ALL_ORG_NAMES[$i]}"
                    break
                fi
            done
        fi
        ;;
    upgrade)
        if [ -z "$2" ]; then
            log_error "Please specify a chaincode: source ./deploy_chaincode.sh upgrade <chaincode>"
        else
            switch_to_ngoorg
            approve_chaincode "$CHANNEL_NAME" "$2" "$SUPPLYCHAIN_CC_PACKAGE_ID"
            commit_chaincode "$CHANNEL_NAME" "$2"
            echo ""
            log_info "NGOOrg upgrade done. Other orgs still need to approve."
            echo -e "${CYAN}Run: source ./deploy_chaincode.sh sync-upgrade $2${NC}"
            echo -e "${CYAN}Or manually: source ./deploy_chaincode.sh approve-chaincode <org> $2 ${CHANNEL_NAME}${NC}"
        fi
        ;;
    sync-upgrade)
        if [ -z "$2" ]; then
            log_error "Please specify a chaincode: source ./deploy_chaincode.sh sync-upgrade <chaincode>"
        else
            sync_upgrade "$2"
        fi
        ;;
    global-install)
        global_install
        ;;
    global-deploy)
        global_deploy
        ;;
    global-upgrade)
        global_upgrade "$2"
        ;;
    query)
        query_committed
        ;;
    query-installed)
        query_installed
        ;;
    check-readiness)
        check_readiness "$CHANNEL_NAME" "${2:-supplychain}"
        ;;
    pending)
        pending_approvals "$2"
        ;;
    approve-chaincode)
        if [ -z "$2" ] || [ -z "$3" ] || [ -z "$4" ]; then
            log_error "Usage: source ./deploy_chaincode.sh approve-chaincode <org> <chaincode> <channel>"
            echo ""
            echo -e "${GREEN}Example:${NC}"
            echo -e "  source ./deploy_chaincode.sh approve-chaincode manufacturerorg supplychain supplychain-channel"
        else
            switch_org "$2"
            approve_chaincode_smart "$4" "$3" "$SUPPLYCHAIN_CC_PACKAGE_ID"
        fi
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        if [ ! -z "$1" ]; then
            log_error "Unknown command: $1"
        fi
        show_help
        ;;
esac
