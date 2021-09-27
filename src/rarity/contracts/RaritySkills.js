/**
 * https://ftmscan.com/address/0x51C0B29A1d84611373BA301706c6B4b72283C80F#code
 * https://github.com/andrecronje/rarity
 */
const ContractManager = require("../../base/ContractManager")
const { rarityEth } = require("../RarityEthereumManager")

class RaritySkills extends ContractManager {

  static CONTRACT_ADDRESS = '0x51C0B29A1d84611373BA301706c6B4b72283C80F'
  static ABI = require('./abi_rarity_skills.json')

  constructor() {
    super(rarityEth, RaritySkills.CONTRACT_ADDRESS, RaritySkills.ABI)
  }

  get_skills(summoner) {
    return this.read('get_skills(uint256)', summoner)
  }

}

module.exports = RaritySkills
