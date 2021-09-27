/**
 * Calculate gas price
 */

const logger = require("./logger")
const NumberUtils = require("./NumberUtils")

/**
 * https://web3js.readthedocs.io/en/v1.5.2/web3-eth.html#getgasprice
 * @returns {String} current gas price in wei.
 */
function getCurrentPrice(web3) {
  return web3.eth.getGasPrice()
}

class GasPriceCalculators {

  static default() {
    return GasPriceCalculators.withPassableLimit()
  }

  static useCurrent() {
    return (web3, price) => getCurrentPrice(web3)
  }

  static withDefaultLimit() {
    return GasPriceCalculators.withLimit(80e9)
  }

  static withDefaultPassable() {
    return GasPriceCalculators.withPassableLimit(150e9)
  }

  /**
   * use currentPrice or maxPrice
   * @param {Number} maxPrice max gas price in wei
   */
   static withLimit(maxPrice) {
    return async function (web3, price) {
      const currentPrice = await getCurrentPrice(web3)
      // try maxPrice and wait, web3 will wait with transactionPollingTimeout
      if (NumberUtils.gt(currentPrice, maxPrice)) {
        logger.info(`current gas price is ${currentPrice}, try to use ${maxPrice}`)
        return maxPrice
      }
      // use currentPrice
      logger.info(`use current gas price ${currentPrice}`)
      return currentPrice
    }
  }

  /**
   * use currentPrice or maxPrice or abort transaction
   * @param {Number} maxPrice max gas price in wei
   * @param {Number|null} abortPrice abort transaction if current gas price is lager than this
   */
  static withAbortLimit(maxPrice, abortPrice) {
    return async function (web3, price) {
      const currentPrice = await getCurrentPrice(web3)
      // if currentPrice > abortPrice, abort the transaction
      if (NumberUtils.gt(currentPrice, abortPrice)) {
        throw Error(`current gas price is ${currentPrice} > ${abortPrice}, abort transaction`)
      }
      // try maxPrice and wait, web3 will wait with transactionPollingTimeout
      if (NumberUtils.gt(currentPrice, maxPrice)) {
        logger.info(`current gas price is ${currentPrice}, try to use ${maxPrice}`)
        return maxPrice
      }
      // use currentPrice
      logger.info(`use current gas price ${currentPrice}`)
      return currentPrice
    }
  }

  /**
   * use passablePrice or abort transaction
   * @param {Number|null} abortPrice abort transaction if passable gas price is lager than this
   * @param {Number|null} offset `passablePrice` is `currentPrice` - `offset`. Default is 20e9. Pass **positive** number for it.
   */
   static withPassableLimit(abortPrice, offset = 15e9) {
    return async function (web3, price) {
      const currentPrice = await getCurrentPrice(web3)
      // If gasPrice too low, transaction fails outright. A passable price would be currentPrice - offset
      const passablePrice = currentPrice - offset
      // if passablePrice > abortPrice, abort the transaction
      if (NumberUtils.gt(passablePrice, abortPrice)) {
        throw Error(`passable gas price is ${passablePrice} > ${abortPrice}, abort transaction`)
      }
      // use passablePrice
      logger.info(`use passable gas price ${passablePrice}`)
      return passablePrice
    }
  }
}

module.exports = GasPriceCalculators
