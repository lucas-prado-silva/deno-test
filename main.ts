import { execute, parse, specifiedRules, subscribe, validate, buildSchema } from 'graphql'
import { envelop, useEngine, useSchema } from '@envelop/core'

const schema = buildSchema(/* GraphQL */ `
  type Query {
    hello: String
  }
`)

export const getEnveloped = envelop({
    plugins: [
        useEngine({
            parse,
            validate,
            specifiedRules,
            execute,
            subscribe
        }),
        useSchema(schema),
    ]
})

const port = 8080;

const handler = async (request: Request): Promise<Response> => {
    try {
        const requestPayload = await request.json();
        const { query, variables } = requestPayload;
        console.log(requestPayload);

        const {
            parse,
            validate,
            contextFactory,
            execute,
            // schema: envelopedSchema
        } = getEnveloped({ requestPayload })

        const queryDocument = parse(query);

        const validationErrors = validate(schema, queryDocument);
        if (validationErrors.length) {
            return new Response("Validation error", { status: 400 });
        }

        const contextValue = await contextFactory()

        const result = await execute({
            document: queryDocument,
            schema,
            variableValues: variables,
            contextValue
        })

        return new Response(JSON.stringify(result), { status: 200 });
    } catch (e) {
        console.log(e)
        return new Response("Internal server error", { status: 500 });
    }
};

console.log(`HTTP server running. Access it at: http://localhost:${port}/`);

Deno.serve({ port }, handler);
