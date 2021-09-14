/**
 * https://ftmscan.com/address/0xce761d788df608bd21bdd59d6f4b54b2e27f25bb#code
 * https://github.com/andrecronje/rarity
 */
const ContractManager = require("../../base/ContractManager")
const { rarityEth } = require("../RarityEthereumManager")

class Rarity extends ContractManager {

  static CONTRACT_ADDRESS = '0xce761d788df608bd21bdd59d6f4b54b2e27f25bb'
  static ABI = require('./abi_rarity.json')

  constructor() {
    super(rarityEth, Rarity.CONTRACT_ADDRESS, Rarity.ABI)
  }

  summon(account, _class) {
    return this.write('summon(uint256)', _class, account)
  }

  adventure(account, id, nonce = null) {
    return this.write('adventure(uint256)', id, account, { gas: 100e4, nonce })
  }

  approve(account, to, hero) {
    return this.write('approve(address,uint256)', [to, hero], account)
  }

  getApproved(hero) {
    return this.read('getApproved(uint256)', [hero])
  }

  /**
   * @returns {_xp, _log, _class, _level}
   */
  summoner(id) {
    return this.read('summoner(uint256)', id)
  }

  /**
   * @returns timestamp
   */
  adventurers_log(id) {
    return this.read('adventurers_log(uint256)', id)
  }

  /**
   * @returns xp
   */
  xp(id) {
    return this.read('xp(uint256)', id)
  }

  xp_required(current_level) {
    return this.read('xp_required(uint256)', current_level)
  }

  level_up(account, id, nonce = null) {
    return this.write('level_up(uint256)', id, account, { gas: 100e4, nonce })
  }
}

module.exports = Rarity
