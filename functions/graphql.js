'use strict'

const co = require('co')
const AWS = require('aws-sdk')
AWS.config.region = 'us-east-1'
const dynamodb = new AWS.DynamoDB.DocumentClient()
const tableOrders = process.env.tableName
const tableUsers = process.env.tableUsers

const {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLNonNull,
  GraphQLList,
  GraphQLID
} = require('graphql')

const User = new GraphQLObjectType({
  name: 'User',
  fields: {
    email: { type: new GraphQLNonNull(GraphQLID) },
    name: { type: GraphQLString },
    lastName: { type: GraphQLString }
  }
})

const Order = new GraphQLObjectType({
  name: 'Order',
  fields: {
    id: { type: new GraphQLNonNull(GraphQLID) },
    productId: { type: GraphQLString },
    type: { type: GraphQLString },
    size: { type: GraphQLString }
  }
})

const OrderPerUser = new GraphQLObjectType({
  name: 'OrderPerUser',
  fields: {
    user: { type: User },
    orders: { type: new GraphQLList(Order) }
  }
})

const RootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    ordersPerUser: {
      type: OrderPerUser,
      args: {
        email: {
          type: new GraphQLNonNull(GraphQLString)
        }
      },
      resolve: (parentObj, args) => {
        return getUserPerOrder(args.email)
      }
    }
  }
})

const schema = new GraphQLSchema({
  query: RootQueryType
})

const validatePayload = (event) => {
  try {
    const body = JSON.parse(event)
    let query = body.query

    if (body.query && body.query.hasOwnProperty('query')) {
      query = body.query.query.replace('\n', ' ', 'g')
    }
    return query
  } catch (e) {
    return event
  }
}

const getUserPerOrder = co.wrap(function * (email) {
  let reqOrders = {
    TableName: tableOrders,
    ExpressionAttributeValues: {
      ':email': email
    },
    FilterExpression: 'email = :email',
    Limit: 10
  }

  let reqUser = {
    TableName: tableUsers,
    Key: {
      email
    }
  }

  const [orders, user] = yield [dynamodb.scan(reqOrders).promise(), dynamodb.get(reqUser).promise()]

  return { user: user.Item, orders: orders.Items }
})

module.exports.handler = (event, context, cb) => {
  const query = validatePayload(event.body)

  return graphql(schema, query)
    .then((response) => {
      cb(null, {statusCode: 200, body: JSON.stringify(response)})
    })
    .catch((error) => {
      cb(error)
    })
}
