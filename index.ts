import { GraphQLNonNull, GraphQLScalarType, GraphQLInputField, GraphQLInputObjectType, GraphQLArgument, GraphQLInterfaceType, GraphQLField, GraphQLObjectType } from "graphql";
import { Kind } from "graphql";
import { ApolloServer, gql, SchemaDirectiveVisitor } from "apollo-server-express";
import express from "express";

export const app = express();
class MyDirective extends SchemaDirectiveVisitor {
  visitInputFieldDefinition(field: GraphQLInputField, details: {
    objectType: GraphQLInputObjectType;
  }): GraphQLInputField | void | null {
    this.wrapType(field);
  }

  visitArgumentDefinition(argument: GraphQLArgument, details: {
    field: GraphQLField<any, any>;
    objectType: GraphQLObjectType | GraphQLInterfaceType;
  }): GraphQLArgument | void | null {
    this.wrapType(argument);
  }

  wrapType(field: GraphQLInputField | GraphQLArgument) {
    if (
      field.type instanceof GraphQLNonNull &&
      field.type.ofType instanceof GraphQLScalarType
    ) {
      field.type = new GraphQLNonNull(new Type(field.type.ofType, field.name));
      return;
    }

    if (field.type instanceof GraphQLScalarType) {
      field.type = new Type(field.type, field.name);
      return;
    }
  }
}

class Type extends GraphQLScalarType {
  constructor(type: GraphQLScalarType, name: string) {
    console.log("Directive constructor runs!");

    super({
      name: `DirScalarType`,

      // For more information about GraphQLScalar type (de)serialization,
      // see the graphql-js implementation:
      // https://github.com/graphql/graphql-js/blob/31ae8a8e8312/src/type/definition.js#L425-L446

      // to client
      serialize(value) {
        console.log("Directive runs!");
        return value;
      },

      // by client in variable
      parseValue(value) {
        console.log("Directive runs!");
        return value;
      },

      // by client in parameter
      parseLiteral(ast) {
        console.log("Directive runs!");
        switch (ast.kind) {
          case Kind.STRING:
            return ast.value;
          default: {
            return undefined;
          }
        }
      }
    });
  }
}

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  # scalar DirScalarType
  directive @dir on ARGUMENT_DEFINITION | INPUT_FIELD_DEFINITION
  input MyType {
    name: String @dir
  }
  type Query {
    hello(name: String @dir): String
  }
`;

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: () => "Hello world!"
  }
};

const graphQLServer = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: { dir: MyDirective }
});


graphQLServer.applyMiddleware({ app });

app.listen(4000).on("listening", () => {
  console.log(`listening on server: http://localhost:4000/graphql`);
});
