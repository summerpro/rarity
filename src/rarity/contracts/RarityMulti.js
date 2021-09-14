/**
 * https://ftmscan.com/address/0xfe2C0fcffF21D10fb3E4DBA672C00b91c0e9D90C#code
 * https://github.com/andrecronje/rarity
 */
const ContractManager = require("../../base/ContractManager")
const { rarityEth } = require("../RarityEthereumManager")

class RarityMulti extends ContractManager {

    static CONTRACT_ADDRESS = '0xfe2C0fcffF21D10fb3E4DBA672C00b91c0e9D90C'
    static ABI = require('./abi_rarity_multi.json')

    constructor() {
        super(rarityEth, RarityMulti.CONTRACT_ADDRESS, RarityMulti.ABI)
    }

    multiple_adventure(account, heroList) {
        return this.write('multiple_adventure(uint256[])', [heroList], account)
    }

    multiple_adventure_crafting_materials(account, heroList) {
        return this.write('multiple_adventure_crafting_materials(uint256[])', [heroList], account)
    }

    multiple_level_up(account, heroList) {
        return this.write('multiple_level_up(uint256[])', [heroList], account)
    }

    multiple_claim_gold(account, heroList) {
        return this.write('multiple_claim_gold(uint256[])', [heroList], account)
    }

    multiple_transfer_materials(account, heroList, to, amountList) {
        return this.write('multiple_transfer_materials(uint256[],uint256,uint256[])', [heroList, to, amountList], account)
    }

    multiple_transfer_gold(account, heroList, to, amountList) {
        return this.write('multiple_transfer_gold(uint256[],uint256,uint256[])', [heroList, to, amountList], account)
    }

    multiple_approve(account, heroList) {
        return this.write('multiple_approve(uint256[])', [heroList], account)
    }

}

module.exports = RarityMulti
