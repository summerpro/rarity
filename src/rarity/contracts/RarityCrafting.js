/**
 * https://ftmscan.com/address/0xf41270836dF4Db1D28F7fd0935270e3A603e78cC#code
 * https://github.com/andrecronje/rarity
 */
const ContractManager = require("../../base/ContractManager")
const { rarityEth } = require("../RarityEthereumManager")

class RarityCrafting extends ContractManager {

    static CONTRACT_ADDRESS = '0xf41270836dF4Db1D28F7fd0935270e3A603e78cC'
    static ABI = require('./abi_rarity_crafting.json')

    constructor() {
        super(rarityEth, RarityCrafting.CONTRACT_ADDRESS, RarityCrafting.ABI)
    }

    next_item() {
        return this.read('next_item()', null)
    }

}

module.exports = RarityCrafting
