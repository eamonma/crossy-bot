import { GraphQLClient, gql } from "graphql-request"

const endpoint = process.env.API_ENDPOINT as string

export const graphQLClient = new GraphQLClient(endpoint, {
  headers: {
    authorization: process.env.API_KEY as string,
  },
})
