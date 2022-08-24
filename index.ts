import * as dotenv from 'dotenv'
dotenv.config()
import cors from 'cors'
import express from 'express'
import {graphqlHTTP} from "express-graphql";
import {buildSchema} from "graphql";
import flickr from './services/Flickr'

const schema = buildSchema(`
  type PhotosetPhoto{
    id: String!
    url_s: String!
    height_s: String!
    width_s: String!
    url_m: String!
    height_m: String!
    width_m: String!
    title: String!
  }
  
  type Photoset {
    photos: [PhotosetPhoto]
  }
  
  type PhotoExif {
    camera: String
    lens: String
    iso: String
    exposureTime: String
    fNumber: String
    focalLength: String
  }
  
  type Photo {
    id: String!
    title: String!
    description: String
    url_s: String
    url_m: String
    url_b: String
    flickr_page: String
    exifs: PhotoExif
  }
  
  type Query {
    photoset: Photoset
    photo(photoId: String): Photo
  }
`);

const root = {
    photoset: async () => await flickr.photoset(),
    photo: async({photoId}: {photoId: string}) => await flickr.photo(photoId)
}

const app = express()
app.use(cors())
app.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}))
app.listen(4000)
console.log('Running a GraphQL API server at http://localhost:4000/')
