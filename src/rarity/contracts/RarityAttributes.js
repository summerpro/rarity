/**
 * https://ftmscan.com/address/0xB5F5AF1087A8DA62A23b08C00C6ec9af21F397a1#code
 * https://github.com/andrecronje/rarity
 */
const ContractManager = require("../../base/ContractManager")
const { rarityEth } = require("../RarityEthereumManager")

class RarityAttributes extends ContractManager {

  static CONTRACT_ADDRESS = '0xB5F5AF1087A8DA62A23b08C00C6ec9af21F397a1'
  static ABI = require('./abi_rarity_attributes.json')

  constructor() {
    super(rarityEth, RarityAttributes.CONTRACT_ADDRESS, RarityAttributes.ABI)
  }

  character_created(summoner) {
    return this.read('character_created(uint256)', summoner)
  }

  point_buy(account, summoner, [_str, _dex, _const, _int, _wis, _cha]) {
    return this.write(
      'point_buy(uint256,uint32,uint32,uint32,uint32,uint32,uint32)',
      [summoner, _str, _dex, _const, _int, _wis, _cha],
      account
    )
  }

  ability_scores(summoner) {
    return this.read('ability_scores(uint256)', summoner)
  }
}

module.exports = RarityAttributes
