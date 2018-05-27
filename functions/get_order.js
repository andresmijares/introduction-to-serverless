'use strict'

const co = require('co')
const AWS = require('aws-sdk')
AWS.config.region = 'us-east-1'
const dynamodb = new AWS.DynamoDB.DocumentClient()
const tableName = process.env.tableName

function * getOrder (id) {
  let req = {
    TableName: tableName,
    Key: {
      id
    },
    Limit: 1
  }
  let response = yield dynamodb.get(req).promise()
  return response.Item
}

module.exports.handler = co.wrap(function * (event, context, cb) {
  const { id } = event.queryStringParameters
  let order = yield getOrder(id)

  let response = {
    statusCode: 200,
    body: JSON.stringify(order)
  }

  cb(null, response)
})
