// Script to extract contract addresses from deployment artifacts
const fs = require('fs');
const path = require('path');

function getContractAddresses() {
    try {
        const artifactsPath = path.join(__dirname, 'artifacts', 'contracts');
        const addresses = {};
        
        // Read SimpleCentralAuthority address
        const authorityArtifact = path.join(artifactsPath, 'SimpleCentralAuthority.sol', 'SimpleCentralAuthority.json');
        if (fs.existsSync(authorityArtifact)) {
            const authorityData = JSON.parse(fs.readFileSync(authorityArtifact, 'utf8'));
            if (authorityData.networks && Object.keys(authorityData.networks).length > 0) {
                const networkId = Object.keys(authorityData.networks)[0];
                addresses.authority = authorityData.networks[networkId].address;
            }
        }
        
        // Read token addresses
        const tokens = ['SimpleAgricultureToken'];
        for (const token of tokens) {
            const tokenArtifact = path.join(artifactsPath, `${token}.sol`, `${token}.json`);
            if (fs.existsSync(tokenArtifact)) {
                const tokenData = JSON.parse(fs.readFileSync(tokenArtifact, 'utf8'));
                if (tokenData.networks && Object.keys(tokenData.networks).length > 0) {
                    const networkId = Object.keys(tokenData.networks)[0];
                    // We'll need to identify which token is which by deployment order
                    // This is a simplified approach - in production you'd want better tracking
                }
            }
        }
        
        // For now, let's create a simple addresses.json file that gets updated by deployment
        return addresses;
    } catch (error) {
        console.error('Error reading contract addresses:', error);
        return null;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getContractAddresses };
}

// If run directly, output addresses
if (require.main === module) {
    const addresses = getContractAddresses();
    console.log(JSON.stringify(addresses, null, 2));
}