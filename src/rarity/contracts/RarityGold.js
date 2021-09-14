/**
 * https://ftmscan.com/address/0x2069B76Afe6b734Fb65D1d099E7ec64ee9CC76B2#code
 * https://github.com/andrecronje/rarity
 */
const ContractManager = require("../../base/ContractManager")
const { rarityEth } = require("../RarityEthereumManager")

class RarityGold extends ContractManager {

  static CONTRACT_ADDRESS = '0x2069B76Afe6b734Fb65D1d099E7ec64ee9CC76B2'
  static ABI = require('./abi_rarity_gold.json')

  constructor() {
    super(rarityEth, RarityGold.CONTRACT_ADDRESS, RarityGold.ABI)
  }

  claimable(account, id) {
    return this.read('claimable(uint256)', id, account)
  }

  claim(account, id) {
    return this.write('claim(uint256)', id, account)
  }

  transfer(account, from, to, amount) {
    return this.write('transfer(uint256,uint256,uint256)',
        [from, to, amount], account)
  }

  balanceOf(id) {
    return this.read('balanceOf(uint256)', id)
  }
}

module.exports = RarityGold
