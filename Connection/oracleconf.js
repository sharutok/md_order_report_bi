const { default: axios } = require("axios");
const oracledb = require("oracledb");


exports.NORMAL_ORACLE_MASTER_PROD = async (query) => {
    const password = await axios.get('http://10.202.65.150:6969/ador/prod/get', {
        headers: {
            'api_key': process.env.ADOR_DB_API_KEY
        }
    })
    
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: process.env.PROD_ADOR_USER,
            password: password?.data,
            connectString: process.env.PROD_ADOR_CONNECTION_STRING,
        });
        const result = await connection.execute(query, [], {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
        });
        return result.rows;
    } catch (err) {
        console.error(err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
};