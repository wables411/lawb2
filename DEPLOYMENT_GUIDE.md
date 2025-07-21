# Chess Game Mainnet Upgrade Guide

This guide outlines the steps to upgrade the chess game from Sanko testnet to mainnet with support for multiple ERC20 tokens.

## Overview

The upgrade involves:
1. **Contract Changes**: Updated to support ERC20 tokens instead of native tokens
2. **Frontend Changes**: Added token selection and approval functionality
3. **Network Migration**: Moving from testnet (1992) to mainnet (1996)

## Supported Tokens

The following tokens are supported on mainnet:
- **$DMT**: `0x754cDAd6f5821077d6915004Be2cE05f93d176f8`
- **$GOLD**: `0x754cDAd6f5821077d6915004Be2cE05f93d176f8`
- **$LAWB**: `0xA7DA528a3F4AD9441CaE97e1C33D49db91c82b9F`
- **$MOSS**: `0xeA240b96A9621e67159c59941B9d588eb290ef09`

## Contract Deployment (lawbchess1 repository)

### Prerequisites
1. Install dependencies:
   ```bash
   cd lawbchess1
   npm install
   ```

2. Set up environment variables:
   ```bash
   # Create .env file
   echo "PRIVATE_KEY=your_private_key_here" > .env
   ```

### Deploy to Mainnet

1. **Deploy new contract**:
   ```bash
   npx hardhat run scripts/deploy-mainnet.js --network sankoMainnet
   ```

2. **Note the deployed address** and update the frontend configuration.

### Upgrade Existing Contract (if applicable)

If you have an existing contract to upgrade:

1. Update the proxy address in `scripts/upgrade-mainnet.js`
2. Run the upgrade:
   ```bash
   npx hardhat run scripts/upgrade-mainnet.js --network sankoMainnet
   ```

## Frontend Updates (lawb2 repository)

### Configuration Updates

1. **Update contract address** in `src/config/tokens.ts`:
   ```typescript
   export const CONTRACT_ADDRESSES = {
     testnet: {
       chess: '0x3112AF5728520F52FD1C6710dD7bD52285a68e47'
     },
     mainnet: {
       chess: 'YOUR_NEW_MAINNET_CONTRACT_ADDRESS' // Replace with actual address
     }
   }
   ```

2. **Verify token addresses** in `src/config/tokens.ts` match the contract constants.

### Key Changes Made

1. **Network Support**: Added Sanko mainnet (chain ID 1996) to appkit configuration
2. **Token Management**: Created hooks for token balance and approval
3. **UI Components**: Added TokenSelector component for choosing wager tokens
4. **Contract Integration**: Updated ABI to support ERC20 token operations

### Testing

1. **Testnet Testing**: Verify functionality on testnet first
2. **Mainnet Testing**: Test with small amounts on mainnet
3. **Token Approvals**: Ensure approval flow works correctly
4. **Game Creation/Joining**: Test with different tokens

## Migration Strategy

### Option 1: Gradual Migration
1. Deploy new contract on mainnet
2. Keep testnet running for testing
3. Update frontend to support both networks
4. Gradually migrate users to mainnet

### Option 2: Complete Migration
1. Deploy new contract on mainnet
2. Update frontend to use mainnet only
3. Discontinue testnet support

## Security Considerations

1. **Token Approvals**: Users must approve tokens before creating/joining games
2. **Balance Checks**: Frontend validates sufficient token balance
3. **Contract Security**: Use OpenZeppelin's ReentrancyGuard and upgradeable patterns
4. **House Wallet**: Ensure house wallet can withdraw accumulated fees

## Troubleshooting

### Common Issues

1. **Token Approval Failures**:
   - Check if user has sufficient token balance
   - Verify token contract is working correctly
   - Ensure approval amount is sufficient

2. **Network Connection Issues**:
   - Verify RPC URLs are correct
   - Check if wallet supports Sanko mainnet
   - Ensure chain ID is properly configured

3. **Contract Interaction Failures**:
   - Verify contract address is correct
   - Check if contract is deployed and initialized
   - Ensure ABI matches deployed contract

### Debug Commands

```bash
# Check contract deployment
npx hardhat verify --network sankoMainnet CONTRACT_ADDRESS

# Check token balances
npx hardhat console --network sankoMainnet
> const token = await ethers.getContractAt("IERC20", "TOKEN_ADDRESS")
> await token.balanceOf("USER_ADDRESS")
```

## Post-Deployment Checklist

- [ ] Contract deployed and verified on mainnet
- [ ] Frontend updated with new contract address
- [ ] Token addresses verified and correct
- [ ] Network configuration updated
- [ ] Token approval flow tested
- [ ] Game creation/joining tested with all tokens
- [ ] House wallet can withdraw fees
- [ ] Error handling implemented
- [ ] User documentation updated

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review contract logs on SankoScan
3. Test with small amounts first
4. Contact development team for assistance 