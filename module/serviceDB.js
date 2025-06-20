import { MongoClient, ServerApiVersion } from "mongodb";

const getClient = async () => {
    const uri = process.env.URI_MONGO;

    const client = new MongoClient(uri, {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        },
    });

    return client.connect();
};

export default { getClient };
