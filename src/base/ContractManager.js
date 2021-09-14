const Web3 = require('web3')
const EthereumManager = require('./EthereumManager')
const logger = require('./logger')

const debug = () => { }
// const debug = logger.info

/**
 * General ethereum contract manager
 * Be caucious: web3 returns uint256 as string instead of number
 *
 * https://web3js.readthedocs.io/en/v1.5.2
 * https://eth.wiki/json-rpc/API
 */
class ContractManager {

  /**
   * @param {EthereumManager} ethereumManager ethereumManager
   * @param {String|null} contractAddress contract address
   * @param {Object|null} abi abi.json
   * };
   */
  constructor(ethereumManager, contractAddress, abi) {
    this.ethereumManager = ethereumManager
    this.contractAddress = contractAddress
    this.contract = new ethereumManager.web3.eth.Contract(abi, contractAddress)
  }

  getContractAddress() {
    return this.contractAddress
  }

  setGasPriceCalculator(calculator) {
    return this.ethereumManager.setGasPriceCalculator(calculator)
  }

  gasPrice() {
    return this.ethereumManager.gasPrice()
  }

  async balance(address, convertToEther = false) {
    return this.ethereumManager.balance(address, convertToEther)
  }

  /**
   * read contract
   * https://web3js.readthedocs.io/en/v1.5.2/web3-eth-contract.html#methods-mymethod-call
   *
   * @param {String} method 'myMethod(uint256, uint256)'
   * @param {Array|*} params '123' or '[123, 456]'
   * @returns {Promise<Object>} 'value' or Result { key1: 'value1', key2: 'value2' }
   */
  async read(method, params, account = null) {
    this.checkContract()
    if (!Array.isArray(params)) params = [params]
    const r = await this.contract.methods[method].apply(undefined, params).call({ from: account})
    debug('read method =', method, 'result =', r)
    return r
  }

  /**
   * write contract, need to call addAccount first
   * https://web3js.readthedocs.io/en/v1.5.2/web3-eth-contract.html#methods-mymethod-send
   *
   * @param {String} method 'myMethod(uint256, uint256)'
   * @param {Array} params '[123, 456]'
   * @param {String} account '0x000...000'
   * @param {Number} gas gas limit, 2.1w for transfer, 6w for simple contract call
   * @param {Number} gasPrice gas price in wei
   * @param {Number} value transfer value in wei
   * @returns {Promise<Object>} 'value' or Result { key1: 'value1', key2: 'value2' } or receipt:
   * {
   *   blockHash: '0x0000809...',
   *   blockNumber: 166...,
   *   contractAddress: null,
   *   cumulativeGasUsed: 1545187,
   *   from: '0x36...',
   *   gasUsed: 68004,
   *   logsBloom: '0x00000...',
   *   status: true,
   *   to: '0xce...',
   *   transactionHash: '0x643...',
   *   transactionIndex: 17,
   *   type: '0x0',
   *   events: {}
   * }
   */
  async write(method, params, account, { gas, gasPrice, value, nonce } = { gas: '5000000' }) {
    this.checkContract()
    if (!account) throw Error('Account is empty!')
    gasPrice = await this.ethereumManager.calcGasPrice(gasPrice)
    if (nonce === null || nonce === undefined) nonce = await this.ethereumManager.transactionCount(account)
    if (!Array.isArray(params)) params = [params]
    logger.info(`===> write contract ${this.contractAddress}`, { account, method, params, options: { value, gasLimit: gas, gasPrice, nonce } })
    const r = await this.contract.methods[method].apply(undefined, params).send({ from: account, gas, gasPrice, value, nonce })
    debug('write method =', method, 'result =', r)
    return r
  }

  checkContract() {
    if (!this.contract) throw Error('Contract not initialized')
  }
}

module.exports = ContractManager
