'use strict'

const co = require('co')
const uuid = require('uuid')
const AWS = require('aws-sdk')
AWS.config.region = 'us-east-1'
const dynamodb = new AWS.DynamoDB.DocumentClient()
// const stage = process.env.stage
const tableName = process.env.tableName

const putToDynamoDB = co.wrap(function * (body, prop, table = tableName) {
  try {
    body.id = uuid()
    const params = {
      TableName: table,
      Item: body
    }
    yield dynamodb.put(params).promise()
    return {
      statusCode: 200,
      body: JSON.stringify({
        [prop]: body[prop]
      }),
    }
  } catch (e) {
    console.log(`Error`, e)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Something went wrong'
      })
    } 
  }
})

module.exports.handler = co.wrap(function * (event, context, callback) {
  const body = JSON.parse(event.body)
  const response = yield putToDynamoDB(body, 'id')
  callback(null, response);
})
