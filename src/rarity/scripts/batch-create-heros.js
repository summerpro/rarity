/**
 * Batch create heros
 * Usage:   node src/rarity/scripts/batch-create-heros.js ACCOUNT_LIST_JSON_FILE HERO_COUNT_PER_ACCOUNT
 * Example: node src/rarity/scripts/batch-create-heros.js secrets/accounts.json 11
 */
const { delay } = require('bluebird')
const path = require('path')
const GasPriceCalculators = require('../../base/GasPriceCalculators')
const logger = require('../../base/logger')
const Rarity = require('../contracts/Rarity')
const { rarityEth } = require('../RarityEthereumManager')
const rarity = new Rarity()
// change here to use different gas price strategy
rarity.setGasPriceCalculator(GasPriceCalculators.default())

async function main() {
  logger.info(process.argv)

  // if (process.argv.length != 5) {
  //   logger.info('Usage:   node src/rarity/scripts/batch-create-heros.js ACCOUNT_LIST_JSON_FILE HERO_COUNT_PER_ACCOUNT')
  //   logger.info('Example: node src/rarity/scripts/batch-create-heros.js secrets/accounts.json 11')
  //   return
  // }

  const accounts = require(path.resolve('.', "../../../secrets/rarity-accounts.json"))
  const heroCount = 100
  const heroClass = 7
  logger.info(`will mint ${heroCount} heros for each of ${accounts.length} accounts`)

  for (const account of accounts) {
    const address = await rarityEth.addAccount(account.privateKey)
    if (address !== account.address) {
      logger.error(`account ${address} import failed`)
      continue
    }
    logger.info(`min heros for account ${address}`)
    for (let i = 0; i < heroCount; ++i) {
      const _class = heroClass
      logger.info(`mint hero ${i} with class ${_class} for account ${address}`)
      try {
        await rarity.summon(address, _class)
        // delay 1s to avoid web3 'nonce too low' error
        await delay(1000)
      } catch (e) {
        logger.error(`mint hero ${i} with class ${_class} for account ${address} failed`, e)
      }
    }
  }
  logger.info(`complete`)
}

main()
