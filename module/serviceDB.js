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

    await client.connect();

    return client.db(process.env.DB_MONGO).collection(process.env.TABLE_MONGO);
};

export default { getClient };
